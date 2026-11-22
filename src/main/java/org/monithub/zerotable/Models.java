package org.monithub.zerotable;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;

public final class Models {
    private Models() {}
    public record Page(@Schema(example="seoul_estimated_sales") String dataset,
                       @Schema(example="1") int page, @Schema(example="100") int size,
                       @Schema(example="2000") long total, boolean hasNext,
                       @Schema(description="upstream 또는 sqlite", example="sqlite") String source,
                       @Schema(format="date-time",example="2026-10-31T07:00:00Z") String fetchedAt,
                       @Schema(description="데이터셋별 원본 JSON 객체. 필드 사전은 datasets를 참고하세요.",
                           example="[{\"STDR_YYQU_CD\":\"20262\",\"TRDAR_CD\":\"3130167\",\"SVC_INDUTY_CD\":\"CS300011\",\"THSMON_SELNG_AMT\":796270824}]")
                       List<JsonNode> items) {}
    public record DatasetView(Catalog.Dataset definition, boolean apiKeyConfigured, long storedRecords, String lastCollectedAt) {}
    public record Run(long id, String dataset, Map<String,String> parameters, String status, int pages,
                      long processed, Long upstreamTotal, Integer nextPage, String startedAt, String finishedAt, String errorCode) {}
    public record CollectionTask(String dataset, Map<String,String> params, Integer pageSize, Integer startPage, Integer maxPages) {}
    public record Error(@Schema(example="UPSTREAM_UNAVAILABLE") String code, String message, String timestamp) {}
}
