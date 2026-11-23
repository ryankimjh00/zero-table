package org.monithub.zerotable;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Flow;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class UpstreamClient {
    private static final int MAX_BYTES = 16 * 1024 * 1024;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
        .followRedirects(HttpClient.Redirect.NEVER).build();
    private final Cache<String, Models.Page> cache = Caffeine.newBuilder().maximumWeight(32 * 1024 * 1024)
        .weigher((String key, Models.Page page) -> page.items().toString().length() * 2 + 512)
        .expireAfterWrite(Duration.ofMinutes(10)).build();
    private final ObjectMapper mapper;
    private final ApiKeys keys;
    private final Map<String, String> bases;
    private long windowStart = System.nanoTime();
    private int windowCalls;

    public UpstreamClient(ObjectMapper mapper, ApiKeys keys,
                          @Value("${app.upstream.seoul}") String seoul,
                          @Value("${app.upstream.stores}") String stores,
                          @Value("${app.upstream.reb}") String reb) {
        this.mapper = mapper;
        this.keys = keys;
        this.bases = Map.of("seoul", seoul, "stores", stores, "reb", reb);
    }

    public Map<String, String> parameters(Catalog.Dataset dataset, Map<String, String> requested) {
        var params = new TreeMap<>(dataset.defaults());
        for (var entry : requested.entrySet()) {
            if (!dataset.parameters().contains(entry.getKey()))
                throw new ApiException(400, "INVALID_PARAMETER", "지원하지 않는 원본 파라미터: " + entry.getKey());
            if (entry.getValue() == null || !entry.getValue().matches("[\\p{L}\\p{N} _.,:;|+\\-]{1,120}"))
                throw new ApiException(400, "INVALID_PARAMETER", "원본 파라미터 형식이 올바르지 않습니다.");
            params.put(entry.getKey(), entry.getValue());
        }
        if (params.containsKey("quarter") && !params.get("quarter").matches("20\\d{2}[1-4]"))
            throw new ApiException(400, "INVALID_QUARTER", "분기는 20262 형식으로 입력하세요.");
        if (dataset.family().equals("reb") && !dataset.service().equals("SttsApiTbl") && !params.containsKey("STATBL_ID"))
            throw new ApiException(400, "STATBL_ID_REQUIRED", "부동산원 통계표 ID(STATBL_ID)가 필요합니다.");
        return Map.copyOf(params);
    }

    public Models.Page fetch(Catalog.Dataset dataset, Map<String, String> requested, int page, int size, boolean cached) {
        if (page < 1 || page > 100000 || size < 1 || size > 1000)
            throw new ApiException(400, "INVALID_PAGE", "page는 1~100000, size는 1~1000입니다.");
        var params = parameters(dataset, requested);
        String cacheKey = dataset.id() + ":" + new TreeMap<>(params) + ":" + page + ":" + size;
        return cached ? cache.get(cacheKey, ignored -> request(dataset, params, page, size)) : request(dataset, params, page, size);
    }

    private synchronized void reserveCall() {
        long now = System.nanoTime();
        if (now - windowStart > Duration.ofMinutes(1).toNanos()) { windowStart = now; windowCalls = 0; }
        if (windowCalls >= 60) throw new ApiException(429, "UPSTREAM_RATE_LIMIT", "원본 API 호출 한도입니다. 잠시 후 다시 요청하세요.");
        windowCalls++;
    }

    private Models.Page request(Catalog.Dataset dataset, Map<String, String> params, int page, int size) {
        URI uri = buildUri(dataset, params, page, size);
        reserveCall();
        JsonNode root;
        try {
            var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json").header("User-Agent", "ZeroTable/0.1").GET().build();
            var pending = http.sendAsync(request, info -> new BoundedBody());
            try {
                var response = pending.get(20, TimeUnit.SECONDS);
                if (response.statusCode() < 200 || response.statusCode() >= 300)
                    throw new ApiException(502, "UPSTREAM_HTTP_" + response.statusCode(), "제공기관 API가 오류를 반환했습니다.");
                byte[] bytes = response.body();
                String text = new String(bytes, StandardCharsets.UTF_8).trim();
                if (text.startsWith("<")) {
                    String code = text.contains("INFO-100") || text.contains("SERVICE_KEY_IS_NOT_REGISTERED") ? "UPSTREAM_KEY_INVALID" : "UPSTREAM_NON_JSON";
                    throw new ApiException(502, code, "제공기관 인증키 또는 응답 형식을 확인하세요.");
                }
                root = mapper.readTree(bytes);
            } finally {
                if (!pending.isDone()) pending.cancel(true);
            }
        } catch (ApiException e) { throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(503, "UPSTREAM_INTERRUPTED", "원본 API 요청이 중단되었습니다.");
        } catch (Exception e) {
            throw new ApiException(502, "UPSTREAM_UNAVAILABLE", "제공기관에 연결할 수 없거나 응답을 해석할 수 없습니다.");
        }
        Models.Page result = parse(dataset, root, page, size);
        if (params.containsKey("quarter") && result.items().stream().anyMatch(row -> !params.get("quarter").equals(row.path("STDR_YYQU_CD").asText())))
            throw new ApiException(502,"UPSTREAM_FILTER_IGNORED","제공기관이 요청한 분기와 다른 자료를 반환했습니다.");
        return result;
    }

    URI buildUri(Catalog.Dataset dataset, Map<String, String> params, int page, int size) {
        String key = keys.get(dataset.keyId());
        String base = bases.get(dataset.family());
        if (dataset.family().equals("seoul")) {
            long start = (long)(page - 1) * size + 1;
            String path = "/" + encode(key) + "/json/" + dataset.service() + "/" + start + "/" + (start + size - 1) + "/";
            if (params.containsKey("quarter")) path += encode(params.get("quarter"));
            return URI.create(base + path);
        }
        var query = new LinkedHashMap<>(params);
        if (dataset.family().equals("stores")) {
            query.put("serviceKey", key.contains("%") ? URLDecoder.decode(key, StandardCharsets.UTF_8) : key);
            query.put("type", "json"); query.put("pageNo", String.valueOf(page)); query.put("numOfRows", String.valueOf(size));
        } else {
            query.put("KEY", key); query.put("Type", "json"); query.put("pIndex", String.valueOf(page)); query.put("pSize", String.valueOf(size));
        }
        String suffix = dataset.family().equals("reb") ? ".do" : "";
        return URI.create(base + "/" + dataset.service() + suffix + "?" + query.entrySet().stream()
            .map(e -> encode(e.getKey()) + "=" + encode(e.getValue())).collect(java.util.stream.Collectors.joining("&")));
    }

    Models.Page parse(Catalog.Dataset dataset, JsonNode root, int page, int size) {
        if (root == null || !root.isObject()) throw new ApiException(502,"UPSTREAM_SCHEMA_CHANGED","제공기관 응답 구조가 예상과 다릅니다.");
        JsonNode rows;
        long total;
        if (dataset.family().equals("seoul")) {
            var data = root.path(dataset.service());
            var result = root.has("RESULT") ? root.path("RESULT") : data.path("RESULT");
            if ("INFO-200".equals(result.path("CODE").asText())) return empty(dataset, page, size);
            checkResult(result.path("CODE").asText());
            rows = data.path("row"); total = data.path("list_total_count").asLong(-1);
        } else if (dataset.family().equals("stores")) {
            var envelope = root.has("response") ? root.path("response") : root;
            String code = envelope.path("header").path("resultCode").asText();
            if (!code.equals("00")) throw new ApiException(502, "UPSTREAM_PROVIDER_ERROR", "소상공인 API 응답 코드 또는 인증키를 확인하세요.");
            var body = envelope.path("body");
            rows = body.path("items");
            if (rows.isObject() && rows.has("item")) rows = rows.path("item");
            total = body.path("totalCount").asLong(-1);
        } else {
            if (root.has("RESULT")) {
                String code = root.path("RESULT").path("CODE").asText();
                if (code.equals("INFO-200")) return empty(dataset, page, size);
                checkResult(code);
            }
            var envelope = root.path(dataset.service());
            if (!envelope.isArray()) throw new ApiException(502, "UPSTREAM_SCHEMA_CHANGED", "부동산원 응답 구조를 확인하세요.");
            total = -1; rows = mapper.createArrayNode();
            for (var section : envelope) {
                if (section.has("head")) for (var head : section.path("head")) {
                    if (head.has("list_total_count")) total = head.path("list_total_count").asLong(-1);
                    if (head.has("RESULT")) checkResult(head.path("RESULT").path("CODE").asText());
                }
                if (section.has("row")) rows = section.path("row");
            }
        }
        if (total < 0 || (!rows.isArray() && !(total == 0 && (rows.isMissingNode() || rows.isNull() || rows.asText().isEmpty()))))
            throw new ApiException(502, "UPSTREAM_SCHEMA_CHANGED", "제공기관 응답 구조가 예상과 다릅니다.");
        List<JsonNode> items = new ArrayList<>();
        if (rows.isArray()) rows.forEach(items::add);
        if (items.isEmpty() && (long)(page - 1) * size < total)
            throw new ApiException(502, "UPSTREAM_INCOMPLETE_PAGE", "제공기관이 빈 페이지를 반환했습니다.");
        return new Models.Page(dataset.id(), page, size, total, (long)(page - 1) * size + items.size() < total,
            "upstream", Instant.now().toString(), List.copyOf(items));
    }

    private void checkResult(String code) {
        if (!"INFO-000".equals(code)) {
            String safeCode = "INFO-100".equals(code) ? "UPSTREAM_KEY_INVALID" : "UPSTREAM_PROVIDER_ERROR";
            throw new ApiException(502, safeCode, "제공기관 API 오류입니다. 인증키·요청 조건·할당량을 확인하세요.");
        }
    }
    private Models.Page empty(Catalog.Dataset dataset, int page, int size) {
        return new Models.Page(dataset.id(), page, size, 0, false, "upstream", Instant.now().toString(), List.of());
    }
    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20"); }

    private static final class BoundedBody implements HttpResponse.BodySubscriber<byte[]> {
        private final HttpResponse.BodySubscriber<byte[]> delegate = HttpResponse.BodySubscribers.ofByteArray();
        private Flow.Subscription subscription;
        private long received;
        private boolean done;
        public CompletionStage<byte[]> getBody() { return delegate.getBody(); }
        public void onSubscribe(Flow.Subscription subscription) { this.subscription=subscription;delegate.onSubscribe(subscription); }
        public void onNext(List<ByteBuffer> buffers) {
            if (done) return;
            for (ByteBuffer buffer:buffers) received+=buffer.remaining();
            if (received>MAX_BYTES) {
                done=true;subscription.cancel();delegate.onError(new IOException("UPSTREAM_TOO_LARGE"));
            } else delegate.onNext(buffers);
        }
        public void onError(Throwable error) { if(!done) { done=true;delegate.onError(error); } }
        public void onComplete() { if(!done) { done=true;delegate.onComplete(); } }
    }
}
