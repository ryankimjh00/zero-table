package org.monithub.zerotable;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class Catalog {
    public record Dataset(String id, String name, String provider, String family, String service,
                          String keyId, String sourceUrl, String description, List<String> identity,
                          List<String> parameters, Map<String, String> defaults, Map<String, String> fields) {}
    private final List<Dataset> datasets;

    public Catalog(ObjectMapper mapper) throws IOException {
        try (var stream = new ClassPathResource("catalog.json").getInputStream()) {
            datasets = mapper.readValue(stream, new TypeReference<>() {});
        }
    }
    public List<Dataset> all() { return datasets; }
    public Dataset get(String id) {
        return datasets.stream().filter(d -> d.id().equals(id)).findFirst()
            .orElseThrow(() -> new ApiException(404, "DATASET_NOT_FOUND", "데이터셋을 찾을 수 없습니다."));
    }
}
