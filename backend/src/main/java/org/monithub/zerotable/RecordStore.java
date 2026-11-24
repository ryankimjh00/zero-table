package org.monithub.zerotable;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class RecordStore {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    public RecordStore(JdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc = jdbc; this.mapper = mapper; }

    @Transactional
    public void save(Catalog.Dataset dataset, Map<String,String> params, Models.Page page, long runId, int pages, long processed) {
        String scope = json(new TreeMap<>(params));
        String now = Instant.now().toString();
        for (var row : page.items()) {
            String payload = json(row);
            String identity = dataset.family().equals("reb") ? params.getOrDefault("STATBL_ID", "") : "";
            for (String field : dataset.identity()) {
                if (!row.has(field) || (!row.hasNonNull(field) && !field.equals("GRP_ID")))
                    throw new ApiException(502, "UPSTREAM_IDENTITY_MISSING", "원본 데이터의 식별 필드가 없습니다: " + field);
                identity += "|" + row.path(field).asText();
            }
            String key = hash(identity);
            jdbc.update("""
                INSERT INTO records(dataset,record_key,quarter,district_code,industry_code,region_code,scope,payload,collected_at)
                VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(dataset,record_key) DO UPDATE SET
                quarter=excluded.quarter,district_code=excluded.district_code,industry_code=excluded.industry_code,
                region_code=excluded.region_code,scope=excluded.scope,payload=excluded.payload,collected_at=excluded.collected_at
                """, dataset.id(), key, text(row,"STDR_YYQU_CD"), text(row,"TRDAR_CD"),
                first(row,"SVC_INDUTY_CD","indsSclsCd"), first(row,"SIGNGU_CD","signguCd"), scope, payload, now);
        }
        jdbc.update("UPDATE collection_runs SET pages=?,processed=?,upstream_total=?,next_page=? WHERE id=?",
            pages, processed, page.total(), page.hasNext() ? page.page()+1 : null, runId);
    }

    public long begin(String dataset, Map<String,String> params, int startPage) {
        jdbc.update("INSERT INTO collection_runs(dataset,parameters,status,next_page,started_at) VALUES(?,?,'RUNNING',?,?)",
            dataset, json(new TreeMap<>(params)), startPage, Instant.now().toString());
        return jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
    }
    public void finish(long id, String status, String code) {
        jdbc.update("UPDATE collection_runs SET status=?,error_code=?,finished_at=? WHERE id=?", status, code, Instant.now().toString(), id);
    }
    public void resolveParameters(long id,Map<String,String> parameters) {
        jdbc.update("UPDATE collection_runs SET parameters=? WHERE id=?",json(new TreeMap<>(parameters)),id);
    }
    public long count(String dataset) { return jdbc.queryForObject("SELECT count(*) FROM records WHERE dataset=?",Long.class,dataset); }
    public String lastCollected(String dataset) { return jdbc.queryForObject("SELECT max(collected_at) FROM records WHERE dataset=?",String.class,dataset); }

    public Models.Page query(String dataset, int page, int size, String quarter, String district, String industry, String region, String table) {
        StringBuilder where = new StringBuilder(" WHERE dataset=?");
        List<Object> args = new ArrayList<>(); args.add(dataset);
        add(where,args,"quarter",quarter); add(where,args,"district_code",district);
        add(where,args,"industry_code",industry); add(where,args,"region_code",region);
        if (table != null) { where.append(" AND json_extract(scope,'$.STATBL_ID')=?"); args.add(table); }
        long total = jdbc.queryForObject("SELECT count(*) FROM records"+where,Long.class,args.toArray());
        String collectedAt = jdbc.queryForObject("SELECT max(collected_at) FROM records"+where,String.class,args.toArray());
        args.add(size); args.add((long)(page-1)*size);
        List<JsonNode> items = jdbc.query("SELECT payload FROM records"+where+" ORDER BY record_key LIMIT ? OFFSET ?",
            (rs, rowNum) -> parse(rs.getString(1)), args.toArray());
        return new Models.Page(dataset,page,size,total,(long)page*size<total,"sqlite",collectedAt,items);
    }

    record AssessmentRow(JsonNode payload, String collectedAt) {}
    record PopulationArea(String population,String area) {}

    List<AssessmentRow> assessmentRows(String dataset,String quarter,String district,String industry) {
        return jdbc.query("""
            SELECT payload, collected_at FROM records
            WHERE dataset=? AND quarter IS ? AND industry_code IS ? AND district_code=?
            """,(rs,i)->new AssessmentRow(parse(rs.getString(1)),rs.getString(2)),dataset,quarter,industry,district);
    }

    List<String> assessmentPeers(String dataset,String quarter,String district,String industry,String districtType,String field) {
        return jdbc.query("""
            SELECT max(CASE WHEN json_type(payload,?) IN ('integer','real','text')
                            THEN json_extract(payload,?) END) AS value
            FROM records
            WHERE dataset=? AND quarter=? AND industry_code IS ? AND district_code<>?
              AND json_extract(payload,'$.TRDAR_SE_CD')=?
            GROUP BY district_code HAVING count(*)=1
            """,(rs,i)->rs.getString("value"),"$."+field,"$."+field,dataset,quarter,industry,district,districtType);
    }

    List<PopulationArea> assessmentPopulationAreas(String dataset,String areaDataset,String quarter,String district,String districtType,String field) {
        return jdbc.query("""
            SELECT max(CASE WHEN json_type(p.payload,?) IN ('integer','real','text')
                            THEN json_extract(p.payload,?) END) AS population,
                   max(CASE WHEN json_type(a.payload,'$.RELM_AR') IN ('integer','real','text')
                            THEN json_extract(a.payload,'$.RELM_AR') END) AS area
            FROM records p
            JOIN records a ON a.dataset=? AND a.quarter IS NULL AND a.industry_code IS NULL
                           AND a.district_code=p.district_code
            WHERE p.dataset=? AND p.quarter=? AND p.industry_code IS NULL AND p.district_code<>?
              AND json_extract(p.payload,'$.TRDAR_SE_CD')=?
              AND json_extract(a.payload,'$.TRDAR_SE_CD')=?
            GROUP BY p.district_code HAVING count(*)=1
            """,(rs,i)->new PopulationArea(rs.getString("population"),rs.getString("area")),
            "$."+field,"$."+field,areaDataset,dataset,quarter,district,districtType,districtType);
    }
    public List<Models.Run> runs(int limit) {
        return jdbc.query("SELECT * FROM collection_runs ORDER BY id DESC LIMIT ?", (rs,i) -> new Models.Run(
            rs.getLong("id"),rs.getString("dataset"),parseMap(rs.getString("parameters")),rs.getString("status"),
            rs.getInt("pages"),rs.getLong("processed"),nullableLong(rs,"upstream_total"),
            nullableInteger(rs,"next_page"),rs.getString("started_at"),rs.getString("finished_at"),rs.getString("error_code")),limit);
    }
    public void recoverRuns() {
        jdbc.update("UPDATE collection_runs SET status='INTERRUPTED',error_code='PROCESS_STOPPED',finished_at=? WHERE status='RUNNING'", Instant.now().toString());
    }
    public void backup(String destination) {
        if (!destination.matches("[\\p{L}\\p{N}_/ .-]+\\.db")) throw new IllegalArgumentException("백업 경로는 .db 파일이어야 합니다.");
        jdbc.execute("VACUUM INTO '"+destination+"'");
    }
    private static void add(StringBuilder where,List<Object> args,String name,String value) {
        if (value != null) { where.append(" AND ").append(name).append("=?"); args.add(value); }
    }
    private static String first(JsonNode row,String a,String b) { return row.hasNonNull(a) ? text(row,a) : text(row,b); }
    private static Long nullableLong(java.sql.ResultSet rs,String name) throws java.sql.SQLException {
        long value=rs.getLong(name);return rs.wasNull()?null:value;
    }
    private static Integer nullableInteger(java.sql.ResultSet rs,String name) throws java.sql.SQLException {
        int value=rs.getInt(name);return rs.wasNull()?null:value;
    }
    private static String text(JsonNode row,String field) { return row.hasNonNull(field) ? row.path(field).asText() : null; }
    private JsonNode parse(String value) { try { return mapper.readTree(value); } catch(Exception e) { throw new IllegalStateException("저장된 JSON 오류"); } }
    private Map<String,String> parseMap(String value) { try { return mapper.readValue(value,new TypeReference<>(){}); } catch(Exception e) { throw new IllegalStateException("저장된 파라미터 오류"); } }
    private String json(Object value) { try { return mapper.writeValueAsString(value); } catch(Exception e) { throw new IllegalStateException("JSON 변환 오류"); } }
    private static String hash(String value) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch(Exception e) { throw new IllegalStateException(e); } }
}
