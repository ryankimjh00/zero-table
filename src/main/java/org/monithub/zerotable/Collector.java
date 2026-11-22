package org.monithub.zerotable;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class Collector {
    private static final Logger log = LoggerFactory.getLogger(Collector.class);
    private final Catalog catalog;
    private final UpstreamClient upstream;
    private final RecordStore store;
    private final ObjectMapper mapper;
    private final String plan;
    private final boolean enabled;
    private final Path lockPath;
    public Collector(Catalog catalog, UpstreamClient upstream, RecordStore store, ObjectMapper mapper,
                     @Value("${app.collection-plan}") String plan, @Value("${app.schedule-enabled}") boolean enabled,
                     @Value("${spring.datasource.url}") String databaseUrl) {
        this.catalog=catalog;this.upstream=upstream;this.store=store;this.mapper=mapper;this.plan=plan;this.enabled=enabled;
        this.lockPath=Path.of(databaseUrl.substring("jdbc:sqlite:".length())+".collection.lock");
    }
    @Scheduled(cron="${app.collection-cron}",zone="Asia/Seoul")
    public void scheduled() {
        if (!enabled) return;
        try { collectPlan(plan); } catch(Exception e) { log.warn("정기 수집 실패: {}", e instanceof ApiException a ? a.code() : "COLLECTION_ERROR"); }
    }
    public List<Models.Run> collectPlan(String file) throws Exception {
        List<Models.CollectionTask> tasks=mapper.readValue(Path.of(file).toFile(),new TypeReference<>(){});
        try (var channel=FileChannel.open(lockPath,StandardOpenOption.CREATE,StandardOpenOption.WRITE);
             var lock=channel.tryLock()) {
            if (lock==null) throw new ApiException(409,"COLLECTION_RUNNING","다른 수집 작업이 실행 중입니다.");
            store.recoverRuns();
            List<Models.Run> result=new ArrayList<>();
            for (var task:tasks) {
                long id=collect(task);
                result.add(store.runs(1).stream().filter(r->r.id()==id).findFirst().orElseThrow());
            }
            return result;
        }
    }
    private long collect(Models.CollectionTask task) {
        var dataset=catalog.get(task.dataset());
        int size=task.pageSize()==null?1000:task.pageSize();
        int start=task.startPage()==null?1:task.startPage();
        int max=task.maxPages()==null?100:task.maxPages();
        if(size<1||size>1000||start<1||start>100000||max<1||max>10000)
            throw new IllegalArgumentException("수집 pageSize/startPage/maxPages 범위 오류");
        Map<String,String> params=new TreeMap<>(task.params()==null?Map.of():task.params());
        boolean latest="latest".equals(params.get("quarter"));
        if(latest) params.remove("quarter");
        params=new TreeMap<>(upstream.parameters(dataset,params));
        long id=store.begin(dataset.id(),params,start);
        int pages=0;long processed=0;
        try {
            if(latest) {
                if(!dataset.parameters().contains("quarter")) throw new IllegalArgumentException("분기 없는 데이터셋");
                params.put("quarter",findLatest(dataset,params));
                store.resolveParameters(id,params);
            }
            for(int page=start;page<start+max;page++) {
                Models.Page response=upstream.fetch(dataset,params,page,size,false);
                pages++;processed+=response.items().size();
                store.save(dataset,params,response,id,pages,processed);
                if(!response.hasNext()) { store.finish(id,"COMPLETE",null);return id; }
                Thread.sleep(1200);
            }
            store.finish(id,"PARTIAL",null);
        } catch(InterruptedException e) {
            Thread.currentThread().interrupt();store.finish(id,"INTERRUPTED","PROCESS_STOPPED");
        } catch(Exception e) {
            String code=e instanceof ApiException a?a.code():"COLLECTION_ERROR";
            store.finish(id,"FAILED",code);log.warn("수집 실패 dataset={} code={}",dataset.id(),code);
        }
        return id;
    }
    private String findLatest(Catalog.Dataset dataset,Map<String,String> parameters) throws InterruptedException {
        LocalDate today=LocalDate.now(ZoneId.of("Asia/Seoul"));
        int quarterIndex=today.getYear()*4+(today.getMonthValue()-1)/3;
        for(int i=0;i<12;i++) {
            int candidate=quarterIndex-i;
            String quarter=""+(candidate/4)+(candidate%4+1);
            var params=new TreeMap<>(parameters);params.put("quarter",quarter);
            if(upstream.fetch(dataset,params,1,1,false).total()>0) return quarter;
            Thread.sleep(1200);
        }
        throw new ApiException(502,"NO_RECENT_QUARTER","최근 12개 분기에서 데이터를 찾지 못했습니다.");
    }
}
