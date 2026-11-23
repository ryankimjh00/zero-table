package org.monithub.zerotable;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ApiKeys {
    private final Map<String, String> keys = new HashMap<>();
    public ApiKeys(ObjectMapper mapper, @Value("${app.api-config}") String path) throws Exception {
        if (Files.isRegularFile(Path.of(path))) {
            var root = mapper.readTree(Path.of(path).toFile());
            for (var api : root.path("apis")) keys.put(api.path("id").asText(), api.path("api_key").asText());
        }
    }
    public boolean configured(String id) { return !keys.getOrDefault(id, "").isBlank(); }
    public String get(String id) {
        if (!configured(id)) throw new ApiException(503, "API_KEY_MISSING", "해당 제공기관의 API 키가 설정되지 않았습니다.");
        return keys.get(id);
    }
}
