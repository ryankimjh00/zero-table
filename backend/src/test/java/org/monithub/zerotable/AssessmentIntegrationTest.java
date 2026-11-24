package org.monithub.zerotable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AssessmentIntegrationTest {
    static final Path TEMP;
    static {
        try { TEMP=Files.createTempDirectory("zero-table-assessments-"); }
        catch(Exception e) { throw new ExceptionInInitializerError(e); }
    }
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",()->"jdbc:sqlite:"+TEMP.resolve("assessment.db"));
        registry.add("app.api-config",()->TEMP.resolve("missing-keys.json").toString());
        registry.add("app.schedule-enabled",()->"false");
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void reset() { jdbc.update("DELETE FROM records"); }

    @Test
    void loadsAssessmentRowsWithoutReadingUnrelatedDistrictsAndIndustries() {
        var plan=jdbc.query("""
            EXPLAIN QUERY PLAN SELECT payload FROM records
            WHERE dataset=? AND quarter=? AND district_code=? AND industry_code=?
            ORDER BY record_key LIMIT ? OFFSET ?
            """,(rs,i)->rs.getString("detail"),"seoul_stores","20262","3111083","CS100010",2,0);
        assertThat(String.join(" ",plan)).contains("quarter=?","district_code=?","industry_code=?");
    }

    @Test
    void calculatesWeightedScoresFromServerRecordsWithoutInventingMissingPoints() throws Exception {
        seed();
        var result=assess(request());
        assertThat(result.path("earnedScore").asDouble()).isEqualTo(34);
        assertThat(result.path("availablePoints").asInt()).isEqualTo(56);
        assertThat(result.path("coveragePercent").asDouble()).isEqualTo(56);
        assertThat(result.path("scoreOutOf100").asDouble()).isEqualTo(60.71);
        assertThat(result.path("totalScore").isNull()).isTrue();
        assertThat(result.path("status").asText()).isEqualTo("PARTIAL");
        assertThat(criterion(result,"customer-age").path("score").asDouble()).isEqualTo(5);
        assertThat(criterion(result,"business-days").path("score").asDouble()).isEqualTo(4);
        assertThat(criterion(result,"main-time").path("score").asDouble()).isEqualTo(10);
        assertThat(criterion(result,"industry-sales").path("score").asDouble()).isEqualTo(5);
        assertThat(criterion(result,"potential-demand").path("score").asDouble()).isEqualTo(5);
        assertThat(criterion(result,"capacity").path("score").asDouble()).isEqualTo(5);
        assertThat(criterion(result,"competition").path("status").asText()).isEqualTo("PENDING_RULE");
        assertThat(criterion(result,"competition").path("evidence").path("storeCountPercentile").asDouble()).isEqualTo(50);
        assertThat(criterion(result,"menu-price").path("score").isNull()).isTrue();
        assertThat(result.path("indicators").path("monthlySalesPerStore").asDouble()).isEqualTo(10_000_000);
        assertThat(result.path("indicators").path("plannedTableUsesPerDay").asDouble()).isEqualTo(15);
        assertThat(result.path("indicators").path("targetDailySales").asDouble()).isEqualTo(833333.33);
        assertThat(result.path("indicators").path("targetSalesPerTeam").asDouble()).isEqualTo(46296.3);
        assertThat(result.path("sources").get(0).path("collectedAt").asText()).isEqualTo("2026-10-31T07:00:00Z");
    }

    @Test
    void comparesWorkerAndResidentDensitiesWithinTheSameDistrictTypeAndQuarter() throws Exception {
        seed();
        insert("seoul_workplace_population","20262","3111083",null,metric("TOT_WRC_POPLTN_CO",1000));
        insert("seoul_commercial_districts",null,"3111083",null,metric("RELM_AR",10000));
        int district=3111090;
        for(int[] peer:new int[][]{{400,5000},{600,5000},{800,10000},{1200,15000},{1400,14000}}) {
            String code=Integer.toString(district++);
            insert("seoul_workplace_population","20262",code,null,metric("TOT_WRC_POPLTN_CO",peer[0]));
            insert("seoul_commercial_districts",null,code,null,metric("RELM_AR",peer[1]));
        }
        insert("seoul_workplace_population","20261","3111110",null,metric("TOT_WRC_POPLTN_CO",5000));
        insert("seoul_workplace_population","20262","3111110",null,metric("TOT_WRC_POPLTN_CO",6000).put("TRDAR_SE_CD","D"));
        insert("seoul_commercial_districts",null,"3111110",null,metric("RELM_AR",10000).put("TRDAR_SE_CD","D"));

        var request=request();
        var result=assess(request);
        var criterion=criterion(result,"customer-type");
        assertThat(criterion.path("score").asDouble()).isEqualTo(3.5);
        assertThat(criterion.path("evidence").path("populationPeerCount").asInt()).isEqualTo(5);
        assertThat(result.path("availablePoints").asInt()).isEqualTo(61);
        assertThat(result.path("scoreOutOf100").asDouble()).isEqualTo(61.48);

        var customer=(ObjectNode)request.path("customer");
        customer.put("type","RESIDENT");
        assertThat(criterion(assess(request),"customer-type").path("score").asDouble()).isEqualTo(2);
        customer.put("type","STUDENT");
        assertThat(criterion(assess(request),"customer-type").path("status").asText()).isEqualTo("UNSUPPORTED_DATA");

        customer.put("type","WORKER");
        replace("seoul_commercial_districts",metric("RELM_AR",0));
        assertThat(criterion(assess(request),"customer-type").path("status").asText()).isEqualTo("MISSING_DATA");
    }

    @Test
    void normalizesDifferentTimeWindowLengthsAndCombinesFiftyPlus() throws Exception {
        seed();
        var request=request();
        ((ObjectNode)request.path("customer")).put("ageGroup","FIFTY_PLUS");
        ((ObjectNode)request.path("schedule")).put("mainTime","DINNER");
        var result=assess(request);
        assertThat(criterion(result,"customer-age").path("score").asDouble()).isEqualTo(9);
        assertThat(criterion(result,"main-time").path("score").asDouble()).isEqualTo(5.63);
        ((ObjectNode)request.path("schedule")).put("mainTime","LATE_NIGHT");
        assertThat(criterion(assess(request),"main-time").path("score").asDouble()).isEqualTo(2.78);
    }

    @Test
    void distinguishesUnansweredAndUnagreedCriteriaFromObservedZero() throws Exception {
        seed();
        var sales=sales();sales.put("AGRDE_20_SELNG_AMT",0);
        replace("seoul_estimated_sales",sales);
        var request=request();
        ((ObjectNode)request.path("readiness")).put("experience","NONE");
        var result=assess(request);
        assertThat(criterion(result,"customer-age").path("score").asDouble()).isZero();
        assertThat(criterion(result,"experience").path("score").isNull()).isTrue();
        assertThat(criterion(result,"experience").path("status").asText()).isEqualTo("PENDING_RULE");
        assertThat(criterion(result,"experience").path("maxScore").asInt()).isEqualTo(5);
        assertThat(result.path("availablePoints").asInt()).isEqualTo(56);
        ((ObjectNode)request.path("customer")).put("ageGroup","UNDECIDED");
        ((ObjectNode)request.path("readiness")).putNull("experience");
        result=assess(request);
        assertThat(criterion(result,"customer-age").path("score").isNull()).isTrue();
        assertThat(criterion(result,"experience").path("status").asText()).isEqualTo("MISSING_ANSWER");
        assertThat(result.path("availablePoints").asInt()).isEqualTo(46);
    }

    @Test
    void neverMixesQuarterDistrictOrIndustry() throws Exception {
        seed();
        for(String[] mismatch:new String[][]{{"quarter","20261"},{"districtCode","3111084"},{"industryCode","CS100001"}}) {
            var request=request();request.put(mismatch[0],mismatch[1]);
            var result=assess(request);
            assertThat(result.path("availablePoints").asInt()).isEqualTo(mismatch[0].equals("industryCode")?16:6);
            assertThat(criterion(result,"industry-sales").path("status").asText()).isEqualTo("MISSING_DATA");
            assertThat(result.path("indicators").has("monthlySalesPerStore")).isFalse();
        }
    }

    @Test
    void doesNotReplaceMissingTotalStoreCountWithOrdinaryStoresOrDivideByZero() throws Exception {
        seed();
        for(String payload:new String[]{"{\"STOR_CO\":10}","{\"SIMILR_INDUTY_STOR_CO\":0}","{\"SIMILR_INDUTY_STOR_CO\":-1}"}) {
            replace("seoul_stores",json.readTree(payload));
            var result=assess(request());
            assertThat(result.path("indicators").has("monthlySalesPerStore")).isFalse();
            assertThat(criterion(result,"competition").path("score").isNull()).isTrue();
            assertThat(result.path("availablePoints").asInt()).isEqualTo(56);
        }
    }

    @Test
    void doesNotTurnMissingOrInvalidUpstreamFieldsIntoScores() throws Exception {
        seed();
        for(JsonNode invalid:new JsonNode[]{json.nullNode(),json.getNodeFactory().textNode("not-a-number"),json.getNodeFactory().numberNode(-1)}) {
            var sales=sales();sales.set("TMZON_11_14_SELNG_AMT",invalid);
            replace("seoul_estimated_sales",sales);
            assertThat(criterion(assess(request()),"main-time").path("status").asText()).isEqualTo("MISSING_DATA");
        }
    }

    @Test
    void benchmarksIndustrySalesIndependentlyOfTheUsersTarget() throws Exception {
        seed();
        var sales=sales();sales.put("THSMON_SELNG_AMT",0);replace("seoul_estimated_sales",sales);
        assertThat(criterion(assess(request()),"industry-sales").path("score").asDouble()).isZero();
        replace("seoul_estimated_sales",sales());
        var request=request();((ObjectNode)request.path("demand")).put("targetMonthlySales",1);
        assertThat(criterion(assess(request),"industry-sales").path("score").asDouble()).isEqualTo(5);
    }

    @Test
    void suggestsABetterTimeOnlyWhenAdjustableWithoutChangingTheScore() throws Exception {
        seed();
        var request=request();
        var schedule=(ObjectNode)request.path("schedule");
        schedule.put("mainTime","DINNER");
        var fixed=assess(request);
        assertThat(fixed.path("suggestions").isEmpty()).isTrue();
        schedule.put("canAdjustHours",true);
        var flexible=assess(request);
        assertThat(flexible.path("earnedScore")).isEqualTo(fixed.path("earnedScore"));
        assertThat(flexible.path("suggestions").path(0).path("suggestedTime").asText()).isEqualTo("LUNCH");
        schedule.put("mainTime","LUNCH");
        assertThat(assess(request).path("suggestions").isEmpty()).isTrue();
    }

    @Test
    void ignoresPeersFromUnrelatedScopesAndHoldsPopulationBelowMinimum() throws Exception {
        seed();
        for(String[] mismatch:new String[][]{{"20261","CS100010","A"},{"20262","CS100001","A"},{"20262","CS100010","D"}}) {
            var row=sales().put("THSMON_SELNG_AMT",900000000).put("TRDAR_SE_CD",mismatch[2]);
            insert("seoul_estimated_sales",mismatch[0],"3111100",mismatch[1],row);
        }
        jdbc.update("DELETE FROM records WHERE dataset='seoul_resident_population' AND district_code='3111094'");
        var result=assess(request());
        assertThat(criterion(result,"industry-sales").path("evidence").path("salesPeerCount").asInt()).isEqualTo(5);
        assertThat(criterion(result,"industry-sales").path("score").asDouble()).isEqualTo(5);
        assertThat(criterion(result,"potential-demand").path("status").asText()).isEqualTo("MISSING_DATA");
        assertThat(result.path("indicators").path("residentPopulation").asInt()).isEqualTo(1000);
    }

    @Test
    void acceptsUndecidedNumericInputsAsNullAndAllowsAnUnansweredQuestionnaire() throws Exception {
        var request=request();request.remove(java.util.List.of("customer","schedule","demand","strategy","readiness"));
        var result=assess(request);
        assertThat(result.path("availablePoints").asInt()).isZero();
        assertThat(result.path("earnedScore").asDouble()).isZero();
        assertThat(result.path("scoreOutOf100").isNull()).isTrue();
        assertThat(result.path("totalScore").isNull()).isTrue();
        request.set("demand",json.readTree("{\"targetMonthlySales\":null}"));
        assertThat(criterion(assess(request),"capacity").path("status").asText()).isEqualTo("MISSING_ANSWER");
    }

    @Test
    void rejectsInvalidChoicesMoneyAndFractionalCountsWithConsistent400Errors() throws Exception {
        for(String patch:new String[]{
            "{\"customer\":{\"ageGroup\":\"UNKNOWN\"}}",
            "{\"demand\":{\"targetMonthlySales\":0}}",
            "{\"demand\":{\"targetMonthlySales\":\"2000만원\"}}",
            "{\"demand\":{\"monthlyOperatingDays\":32}}",
            "{\"demand\":{\"expectedDailyTeams\":0}}",
            "{\"strategy\":{\"startupCapital\":-1}}",
            "{\"strategy\":{\"tableCount\":1.5}}",
            "{\"strategy\":{\"dailyTurns\":101}}",
            "{\"quarter\":\"20265\"}","{\"districtCode\":\"\"}"}) {
            var request=request();request.setAll((ObjectNode)json.readTree(patch));
            mvc.perform(post("/api/v1/assessments").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(request)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        }
        mvc.perform(post("/api/v1/assessments").contentType(MediaType.APPLICATION_JSON).content("{"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void exposesRulesSwaggerAndPostCors() throws Exception {
        mvc.perform(get("/api/v1/assessments/rules")).andExpect(status().isOk())
            .andExpect(jsonPath("$.maxScore").value(100)).andExpect(jsonPath("$.currentlySupportedPoints").value(61));
        mvc.perform(options("/api/v1/assessments").header("Origin","https://frontend.example")
            .header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","content-type"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","*"));
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
            .andExpect(jsonPath("$.paths['/api/v1/assessments'].post.requestBody.content['application/json'].example").exists())
            .andExpect(jsonPath("$.components.schemas.AssessmentRequest.properties.strategy").exists())
            .andExpect(jsonPath("$.components.schemas.AssessmentResult.properties.scoreOutOf100").exists());
    }

    ObjectNode request() throws Exception {
        return (ObjectNode)json.readTree("""
            {"quarter":"20262","districtCode":"3111083","industryCode":"CS100010",
             "customer":{"type":"WORKER","ageGroup":"TWENTIES","visitPurpose":"WORK_SCHOOL"},
             "schedule":{"businessDays":"WEEKDAYS","mainTime":"LUNCH"},
             "demand":{"targetMonthlySales":20000000,"monthlyOperatingDays":24,"expectedDailyTeams":18},
             "strategy":{"menuPrice":12000,"areaPyeong":10,"seatCount":15,"tableCount":5,"dailyTurns":3,"startupCapital":50000000,"monthlyCapital":3000000},
             "readiness":{"experience":"EMPLOYEE","participation":"FULL_TIME"}}
            """);
    }
    ObjectNode sales() throws Exception {
        return (ObjectNode)json.readTree("""
            {"TRDAR_SE_CD":"A","THSMON_SELNG_AMT":600000000,"THSMON_SELNG_CO":30000,
             "AGRDE_10_SELNG_AMT":20000000,"AGRDE_20_SELNG_AMT":100000000,"AGRDE_30_SELNG_AMT":200000000,
             "AGRDE_40_SELNG_AMT":100000000,"AGRDE_50_SELNG_AMT":80000000,"AGRDE_60_ABOVE_SELNG_AMT":100000000,
             "MDWK_SELNG_AMT":300000000,"WKEND_SELNG_AMT":300000000,
             "TMZON_00_06_SELNG_AMT":90000000,"TMZON_06_11_SELNG_AMT":75000000,"TMZON_11_14_SELNG_AMT":180000000,
             "TMZON_14_17_SELNG_AMT":60000000,"TMZON_17_21_SELNG_AMT":135000000,"TMZON_21_24_SELNG_AMT":60000000}
            """);
    }
    void seed() throws Exception {
        insert("seoul_estimated_sales","20262","3111083","CS100010",sales());
        insert("seoul_stores","20262","3111083","CS100010",metric("SIMILR_INDUTY_STOR_CO",20));
        insert("seoul_pedestrian_population","20262","3111083",null,metric("TOT_FLPOP_CO",10000));
        insert("seoul_resident_population","20262","3111083",null,metric("TOT_REPOP_CO",1000));
        int district=3111090;
        for(double scale:new double[]{0.2,0.5,1,2,3}) {
            String code=Integer.toString(district++);
            insert("seoul_estimated_sales","20262",code,"CS100010",metric("THSMON_SELNG_AMT",600000000*scale));
            insert("seoul_stores","20262",code,"CS100010",metric("SIMILR_INDUTY_STOR_CO",20*scale));
            insert("seoul_pedestrian_population","20262",code,null,metric("TOT_FLPOP_CO",10000*scale));
            insert("seoul_resident_population","20262",code,null,metric("TOT_REPOP_CO",1000*scale));
        }
    }
    ObjectNode metric(String field,double value) { return json.createObjectNode().put("TRDAR_SE_CD","A").put(field,value); }
    void insert(String dataset,String quarter,String district,String industry,JsonNode payload) throws Exception {
        jdbc.update("INSERT INTO records(dataset,record_key,quarter,district_code,industry_code,scope,payload,collected_at) VALUES(?,?,?,?,?,'{}',?,'2026-10-31T07:00:00Z')",
            dataset,quarter+district+industry,quarter,district,industry,json.writeValueAsString(payload));
    }
    void replace(String dataset,JsonNode payload) throws Exception {
        jdbc.update("UPDATE records SET payload=? WHERE dataset=? AND district_code='3111083'",json.writeValueAsString(payload),dataset);
    }
    JsonNode assess(ObjectNode request) throws Exception {
        return json.readTree(mvc.perform(post("/api/v1/assessments").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(request)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray());
    }
    JsonNode criterion(JsonNode result,String id) {
        for(var category:result.path("categories")) for(var criterion:category.path("criteria"))
            if(criterion.path("id").asText().equals(id)) return criterion;
        throw new AssertionError("평가 항목 없음: "+id);
    }
}
