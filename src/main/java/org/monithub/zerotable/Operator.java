package org.monithub.zerotable;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class Operator implements ApplicationRunner {
    private final Collector collector;
    private final RecordStore store;
    private final Catalog catalog;
    private final ObjectMapper mapper;
    private final ConfigurableApplicationContext context;
    private final String command;
    private final String plan;
    private final String output;
    public Operator(Collector collector, RecordStore store, Catalog catalog, ObjectMapper mapper, ConfigurableApplicationContext context,
                    @Value("${app.command:serve}") String command, @Value("${app.collection-plan}") String plan,
                    @Value("${app.output:./docs/DATA-CATALOG.md}") String output) {
        this.collector=collector;this.store=store;this.catalog=catalog;this.mapper=mapper;this.context=context;
        this.command=command;this.plan=plan;this.output=output;
    }
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if(command.equals("serve")) return;
        int code=0;
        try {
            switch(command) {
                case "collect" -> {
                    List<Models.Run> runs=collector.collectPlan(plan);
                    System.out.println(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(runs));
                    code=runs.stream().anyMatch(r->r.status().equals("FAILED")||r.status().equals("INTERRUPTED"))?1:0;
                }
                case "backup" -> { store.backup(output); System.out.println("SQLite 백업 완료: "+output); }
                case "catalog" -> {
                    var text=new StringBuilder("# 수집 가능 데이터 목록\n\n이 파일은 catalog.json에서 생성합니다. `./scripts/export-docs.sh`로 갱신하세요.\n\n");
                    for(var d:catalog.all()) {
                        text.append("## ").append(d.name()).append("\n\n- ID: `").append(d.id()).append("`\n- 제공기관: ").append(d.provider())
                            .append("\n- 원본: [공식 문서](").append(d.sourceUrl()).append(")\n- 서비스: `").append(d.service())
                            .append("`\n- 설명: ").append(d.description()).append("\n- 원본 요청 파라미터: `").append(String.join(", ",d.parameters()))
                            .append("`\n- 기본값: `").append(d.defaults()).append("`\n\n| 원본 필드 | 설명 |\n| --- | --- |\n");
                        d.fields().forEach((field,label)->text.append("| `").append(field).append("` | ").append(label).append(" |\n"));
                        text.append("\n");
                    }
                    Path path=Path.of(output);Files.createDirectories(path.toAbsolutePath().getParent());Files.writeString(path,text);System.out.println("데이터 문서 생성 완료");
                }
                default -> throw new IllegalArgumentException("지원하지 않는 명령");
            }
        } finally {
            context.close();
        }
        System.exit(code);
    }
}
