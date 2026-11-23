package org.monithub.zerotable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class BackendIntegrationTest {
    static final ObjectMapper JSON=new ObjectMapper();
    static final Path TEMP;
    static final HttpServer SERVER;
    static final AtomicInteger CALLS=new AtomicInteger();
    static {
        try {
            TEMP=Files.createTempDirectory("zero-table-tests-");
            Files.writeString(TEMP.resolve("keys.json"),"""
                {"apis":[{"id":"seoul_estimated_sales","api_key":"private-test-key"},
                {"id":"small_business_stores","api_key":"test%2Bkey%3D"},
                {"id":"reb_real_estate_statistics","api_key":"private-reb-key"}]}
                """);
            SERVER=HttpServer.create(new java.net.InetSocketAddress("127.0.0.1",0),0);
            SERVER.createContext("/",exchange->{
                CALLS.incrementAndGet();
                String path=exchange.getRequestURI().getPath();
                String query=exchange.getRequestURI().getRawQuery();
                String body;
                if(path.endsWith("/20994")) {
                    body="""
                        <RESULT><CODE>INFO-100</CODE><MESSAGE>private-test-key</MESSAGE></RESULT>
                        """;
                } else if(path.contains("SttsApiTblData")) {
                    body="""
                        {"SttsApiTblData":[{"head":[{"list_total_count":1},{"RESULT":{"CODE":"INFO-000"}}]},
                        {"row":[{"STATBL_ID":"T1","DTACYCLE_CD":"YY","WRTTIME_IDTFR_ID":"2025","GRP_ID":null,"CLS_ID":1,"ITM_ID":2,"DTA_VAL":98.5}]}]}
                        """;
                } else if(path.contains("storeListInDong")) {
                    if(query==null||!query.contains("serviceKey=test%2Bkey%3D")) throw new AssertionError("서비스 키 이중 인코딩");
                    body="""
                        {"header":{"resultCode":"00"},"body":{"totalCount":1,"items":[{"bizesId":"S1","bizesNm":"테스트 상점","signguCd":"11680","indsSclsCd":"I123"}]}}
                        """;
                } else if(path.endsWith("/20261")&&path.contains("/2/2/")) {
                    body="""
                        {"RESULT":{"CODE":"ERROR-500","MESSAGE":"private-test-key"}}
                        """;
                } else if(path.endsWith("/20991")) {
                    body="""
                        {"RESULT":{"CODE":"INFO-200","MESSAGE":"데이터 없음"}}
                        """;
                } else {
                    boolean second=path.contains("/2/2/");
                    String district=second?"D2":"D1";
                    body="{\"VwsmTrdarSelngQq\":{\"list_total_count\":2,\"RESULT\":{\"CODE\":\"INFO-000\"},\"row\":[{\"STDR_YYQU_CD\":\""+
                        (path.matches(".*/20\\d{2}[1-4]$")?path.substring(path.lastIndexOf('/')+1):"20262")+"\",\"TRDAR_CD\":\""+district+"\",\"SVC_INDUTY_CD\":\"CS100010\",\"THSMON_SELNG_AMT\":123456}]}}";
                }
                byte[] bytes=body.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200,bytes.length);
                exchange.getResponseBody().write(bytes);exchange.close();
            });
            SERVER.start();
        } catch(Exception e) { throw new ExceptionInInitializerError(e); }
    }
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",()->"jdbc:sqlite:"+TEMP.resolve("data.db"));
        registry.add("app.api-config",()->TEMP.resolve("keys.json").toString());
        for(String family:List.of("seoul","stores","reb")) registry.add("app.upstream."+family,()->"http://127.0.0.1:"+SERVER.getAddress().getPort());
        registry.add("app.schedule-enabled",()->"false");
    }
    @Autowired MockMvc mvc;
    @Autowired Collector collector;
    @Autowired RecordStore store;
    @Autowired UpstreamClient upstream;
    @Autowired Catalog catalog;

    @Test
    void collectsAllPagesAndUpdatesWithoutDuplicates() throws Exception {
        var task=new Models.CollectionTask("seoul_estimated_sales",Map.of("quarter","20262"),1,1,5);
        var first=collect(task);
        assertThat(first.status()).isEqualTo("COMPLETE");assertThat(first.pages()).isEqualTo(2);assertThat(first.nextPage()).isNull();
        collect(task);
        mvc.perform(get("/api/v1/datasets/seoul_estimated_sales/records").param("quarter","20262").param("districtCode","D1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].THSMON_SELNG_AMT").value(123456));
        assertThat(store.query("seoul_estimated_sales",1,100,"20262",null,null,null,null).total()).isEqualTo(2);
    }
    @Test
    void preservesCommittedPagesOnFailureAndSupportsResume() throws Exception {
        var partial=collect(new Models.CollectionTask("seoul_estimated_sales",Map.of("quarter","20261"),1,1,1));
        assertThat(partial.status()).isEqualTo("PARTIAL");assertThat(partial.nextPage()).isEqualTo(2);
        var failed=collect(new Models.CollectionTask("seoul_estimated_sales",Map.of("quarter","20261"),1,2,3));
        assertThat(failed.status()).isEqualTo("FAILED");assertThat(failed.nextPage()).isEqualTo(2);
        assertThat(store.query("seoul_estimated_sales",1,100,"20261",null,null,null,null).total()).isEqualTo(1);
    }
    @Test
    void handlesRebNullableGroupAndStoreEnvelope() throws Exception {
        assertThat(collect(new Models.CollectionTask("reb_real_estate_statistics",Map.of("STATBL_ID","T1","DTACYCLE_CD","YY"),100,1,1)).status()).isEqualTo("COMPLETE");
        assertThat(collect(new Models.CollectionTask("small_business_stores",Map.of(),100,1,1)).status()).isEqualTo("COMPLETE");
        assertThat(store.count("reb_real_estate_statistics")).isEqualTo(1);
        assertThat(store.query("small_business_stores",1,10,null,null,"I123","11680",null).total()).isEqualTo(1);
        Path rawKeyFile=TEMP.resolve("raw-key.json");
        Files.writeString(rawKeyFile,"{\"apis\":[{\"id\":\"small_business_stores\",\"api_key\":\"test+key=\"}]}");
        var client=new UpstreamClient(JSON,new ApiKeys(JSON,rawKeyFile.toString()),"http://localhost","http://localhost","http://localhost");
        assertThat(client.buildUri(catalog.get("small_business_stores"),Map.of("divId","ctprvnCd","key","11"),1,1).getRawQuery())
            .contains("serviceKey=test%2Bkey%3D");
    }
    @Test
    void proxyCachesAndHidesCredentialsAndRejectsUrlInjection() throws Exception {
        int before=CALLS.get();
        for(int i=0;i<2;i++) mvc.perform(get("/api/v1/proxy/seoul_estimated_sales").param("size","1").param("quarter","20992"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.source").value("upstream"));
        assertThat(CALLS.get()-before).isEqualTo(1);
        var error=mvc.perform(get("/api/v1/proxy/seoul_estimated_sales").param("quarter","20994")).andExpect(status().isBadGateway()).andReturn();
        assertThat(error.getResponse().getContentAsString()).doesNotContain("private-test-key");
        mvc.perform(get("/api/v1/proxy/seoul_estimated_sales").param("url","http://127.0.0.1/secrets")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/proxy/seoul_estimated_sales").param("serviceKey","stolen")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/proxy/unknown")).andExpect(status().isNotFound());
    }
    @Test
    void validatesPaginationAndAllowsBrowserCors() throws Exception {
        mvc.perform(get("/api/v1/datasets/seoul_estimated_sales/records").param("size","1001")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/datasets/seoul_estimated_sales/records").param("page","0")).andExpect(status().isBadRequest());
        mvc.perform(options("/api/v1/datasets").header("Origin","https://future-frontend.example").header("Access-Control-Request-Method","GET"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","*"));
        var response=mvc.perform(get("/api/v1/datasets")).andExpect(status().isOk()).andReturn();
        assertThat(response.getResponse().getContentAsString()).doesNotContain("private-test-key","private-reb-key");
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
            .andExpect(jsonPath("$.paths['/api/v1/proxy/{dataset}'].get.responses['200'].content").exists())
            .andExpect(jsonPath("$.components.schemas.Page.properties.items").exists());
    }
    @Test
    void backsUpWalDatabaseConsistently() throws Exception {
        Path backup=TEMP.resolve("backup.db");store.backup(backup.toString());
        try(var connection=java.sql.DriverManager.getConnection("jdbc:sqlite:"+backup);var statement=connection.createStatement();var rows=statement.executeQuery("PRAGMA integrity_check")) {
            assertThat(rows.next()).isTrue();assertThat(rows.getString(1)).isEqualTo("ok");
        }
    }
    @Test
    void emptyProviderResultIsAValidEmptyPage() {
        var result=upstream.fetch(catalog.get("seoul_estimated_sales"),Map.of("quarter","20991"),1,1,false);
        assertThat(result.total()).isZero();assertThat(result.hasNext()).isFalse();assertThat(result.items()).isEmpty();
    }
    Models.Run collect(Models.CollectionTask task) throws Exception {
        Path plan=Files.createTempFile(TEMP,"plan-",".json");JSON.writeValue(plan.toFile(),List.of(task));
        return collector.collectPlan(plan.toString()).get(0);
    }
}
