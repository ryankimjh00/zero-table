package org.monithub.zerotable;

import static org.monithub.zerotable.AssessmentModels.*;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssessmentService {
    private static final String VERSION="2026-11-24-v3";
    private static final String SALES="seoul_estimated_sales", STORES="seoul_stores";
    private static final String PEDESTRIANS="seoul_pedestrian_population", RESIDENTS="seoul_resident_population";
    private static final String WORKERS="seoul_workplace_population", DISTRICTS="seoul_commercial_districts";
    private static final int MIN_PEERS=5;
    private static final List<Rule> RULES=List.of(
        new Rule("customer","customer-type","목표 고객 유형과 상권 특성",5,true,"5 × 같은 분기·상권 유형의 인구 밀도 백분위(0~1). 직장인은 직장인구, 지역 주민은 상주인구를 사용합니다."),
        new Rule("customer","customer-age","주요 고객 연령",10,true,"10 × 선택 연령 매출 / 가장 큰 연령군 매출 (50대 이상은 합산)"),
        new Rule("customer","customer-purpose","고객 방문 목적",5,false,"방문 목적별 구매 자료가 없어 판단 보류"),
        new Rule("schedule","business-days","영업 요일",10,true,"10 × 선택 요일군의 일평균 매출 / 높은 요일군의 일평균 매출; 모두 영업은 10점"),
        new Rule("schedule","main-time","주요 판매 시간",10,true,"10 × 선택 시간대 시간당 매출 / 가장 높은 시간대 시간당 매출"),
        new Rule("demand","industry-sales","업종별 추정매출 수준",10,true,"10 × 같은 분기·상권 유형·업종 내 분기 추정매출 백분위(0~1)"),
        new Rule("demand","potential-demand","유동·상주인구 기반 잠재 수요",10,true,"5 × 유동인구 백분위 + 5 × 상주인구 백분위(0~1). 같은 분기·상권 유형별 비교"),
        new Rule("strategy","competition","동종업종 경쟁 환경",8,false,"같은 분기·상권 유형·업종의 전체 점포 수를 비교합니다. 점포 수의 점수 방향과 구간은 협의가 필요합니다."),
        new Rule("strategy","menu-price","대표 메뉴 가격 경쟁력",6,false,"동일 메뉴의 비교 가격 자료가 없어 판단 보류"),
        new Rule("strategy","capacity","매장 수용 계획",6,true,"6 × min(1, 테이블 수 × 하루 회전 수 ÷ 하루 예상 방문 팀 수)"),
        new Rule("strategy","startup-capital","초기 자본",5,false,"후보 점포의 보증금·권리금·시설비 자료가 없어 판단 보류"),
        new Rule("strategy","monthly-capital","월 운영자금",5,false,"후보 점포의 임대료·인건비·원가 자료가 없어 판단 보류"),
        new Rule("readiness","experience","관련 업종 근무·운영 경험",5,false,"경험 및 보완 계획을 반영할 채점 기준 협의가 필요합니다."),
        new Rule("readiness","participation","직접 운영 참여",5,false,"영업 일정과 대체 인력을 반영할 채점 기준 협의가 필요합니다.")
    );
    private final RecordStore store;
    private final Catalog catalog;

    public AssessmentService(RecordStore store,Catalog catalog) { this.store=store;this.catalog=catalog; }

    public RuleSet rules() {
        int supported=RULES.stream().filter(Rule::supported).mapToInt(Rule::maxScore).sum();
        return new RuleSet(VERSION,100,supported,"scoreOutOf100은 계산된 점수를 평가 가능 배점으로 나눠 100점으로 환산합니다. 평가 가능 배점이 0이면 null입니다. totalScore는 전체 평가 후에 제공합니다.",RULES);
    }

    @Transactional(readOnly=true)
    public Result assess(Request request) {
        var salesRows=store.assessmentRows(SALES,request.quarter(),request.districtCode(),request.industryCode());
        var storeRows=store.assessmentRows(STORES,request.quarter(),request.districtCode(),request.industryCode());
        var pedestrianRows=store.assessmentRows(PEDESTRIANS,request.quarter(),request.districtCode(),null);
        var residentRows=store.assessmentRows(RESIDENTS,request.quarter(),request.districtCode(),null);
        var type=request.customer()==null?null:request.customer().type();
        var workerRows=type==CustomerType.WORKER?store.assessmentRows(WORKERS,request.quarter(),request.districtCode(),null):List.<RecordStore.AssessmentRow>of();
        boolean usesArea=type==CustomerType.WORKER||type==CustomerType.RESIDENT;
        var districtRows=usesArea?store.assessmentRows(DISTRICTS,null,request.districtCode(),null):List.<RecordStore.AssessmentRow>of();
        JsonNode sales=single(salesRows), stores=single(storeRows), pedestrians=single(pedestrianRows), residents=single(residentRows);
        var criteria=new LinkedHashMap<String,Criterion>();
        for(var rule:RULES) criteria.put(rule.id(),pending(rule,rule.supported()?"MISSING_ANSWER":"UNSUPPORTED_DATA",
            rule.supported()?"답변이 미정입니다.":rule.formula()));

        scoreCustomerType(request,type,single(workerRows),residents,single(districtRows),criteria);
        scoreAge(request, sales, criteria);
        scoreDays(request, sales, criteria);
        var suggestions=scoreTime(request, sales, criteria);
        scoreDemand(request,sales,pedestrians,residents,criteria);
        assessCompetition(request,stores,criteria);
        scoreCapacity(request,criteria);
        assessReadiness(request.readiness(),criteria);

        List<Category> categories=new ArrayList<>();
        String[] ids={"customer","schedule","demand","strategy","readiness"};
        String[] names={"목표 고객 적합도","판매 시간 적합도","업종 수요 수준","경쟁 전략과 점포 조건","운영 준비도"};
        for(int i=0;i<ids.length;i++) {
            String id=ids[i];
            var items=RULES.stream().filter(r->r.category().equals(id)).map(r->criteria.get(r.id())).toList();
            int available=items.stream().filter(c->c.score()!=null).mapToInt(Criterion::maxScore).sum();
            double score=items.stream().filter(c->c.score()!=null).mapToDouble(Criterion::score).sum();
            categories.add(new Category(id,names[i],available==0?null:round(score),available,items.stream().mapToInt(Criterion::maxScore).sum(),items));
        }
        int available=categories.stream().mapToInt(Category::availablePoints).sum();
        double earned=round(criteria.values().stream().filter(c->c.score()!=null).mapToDouble(Criterion::score).sum());
        var sources=new ArrayList<>(List.of(source(SALES,salesRows),source(STORES,storeRows),source(PEDESTRIANS,pedestrianRows),source(RESIDENTS,residentRows)));
        if(type==CustomerType.WORKER) sources.add(source(WORKERS,workerRows));
        if(usesArea) sources.add(source(DISTRICTS,districtRows));
        return new Result(VERSION,available==100?"COMPLETE":"PARTIAL",available==100?earned:null,
            available==0?null:round(100*earned/available),
            earned,available,100,available,categories,indicators(request,sales,stores,pedestrians,residents),
            sources,
            suggestions,List.of(
                "점포당 월매출 참고값은 분기 추정매출을 3개월과 전체 점포 수로 나눠 계산합니다.",
                "수용 계획은 한 팀이 테이블 하나를 사용하는 가정으로 계산합니다. 실제 배치와 피크 시간 수용량은 별도 확인이 필요합니다.",
                "요일별 매출과 시간대별 매출은 각각의 집계입니다."));
    }

    private void scoreCustomerType(Request r,CustomerType type,JsonNode workers,JsonNode residents,JsonNode district,Map<String,Criterion> result) {
        String id="customer-type";
        if(undecided(type)) return;
        if(type==CustomerType.STUDENT||type==CustomerType.TOURIST) {
            result.put(id,pending(rule(id),"UNSUPPORTED_DATA","학생·관광객에 적용할 검증된 상권 비교 자료가 필요합니다."));
            return;
        }
        boolean worker=type==CustomerType.WORKER;
        String dataset=worker?WORKERS:RESIDENTS;
        String field=worker?"TOT_WRC_POPLTN_CO":"TOT_REPOP_CO";
        JsonNode target=worker?workers:residents;
        Double population=number(target,field),area=number(district,"RELM_AR");
        Double targetDensity=density(population,area);
        String districtType=target==null?"":target.path("TRDAR_SE_CD").asText("");
        if(targetDensity==null||districtType.isBlank()||!districtType.equals(district.path("TRDAR_SE_CD").asText())) {
            missingCustomerDensity(result);
            return;
        }
        var peers=store.assessmentPopulationAreas(dataset,DISTRICTS,r.quarter(),r.districtCode(),districtType,field).stream()
            .map(peer->density(number(peer.population()),number(peer.area()))).toList();
        var comparison=percentile(targetDensity,peers);
        if(comparison==null) { missingCustomerDensity(result);return; }
        scored(result,id,comparison.percentile(),Map.of("targetPopulation",population,"districtAreaSquareMeters",area,
            "populationPerSquareKilometer",round(targetDensity),"populationDensityPercentile",round(comparison.percentile()*100),
            "populationPeerCount",(double)comparison.peerCount()));
    }

    private static Double density(Double population,Double area) {
        if(population==null||area==null||area<=0) return null;
        double value=population/area*1_000_000;
        return Double.isFinite(value)?value:null;
    }

    private static void missingCustomerDensity(Map<String,Criterion> result) {
        result.put("customer-type",pending(rule("customer-type"),"MISSING_DATA",
            "대상 상권의 인구·면적과 동일 분기·상권 유형의 유효한 비교 상권 "+MIN_PEERS+"곳이 필요합니다."));
    }

    private void scoreAge(Request r,JsonNode sales,Map<String,Criterion> result) {
        if(r.customer()==null||undecided(r.customer().ageGroup())) return;
        double[] ages=values(sales,"AGRDE_10_SELNG_AMT","AGRDE_20_SELNG_AMT","AGRDE_30_SELNG_AMT","AGRDE_40_SELNG_AMT","AGRDE_50_SELNG_AMT","AGRDE_60_ABOVE_SELNG_AMT");
        if(ages==null) { missing(result,"customer-age");return; }
        double[] groups={ages[0],ages[1],ages[2],ages[3],ages[4]+ages[5]};
        double max=Arrays.stream(groups).max().orElse(0);
        if(max==0) { missing(result,"customer-age");return; }
        double selected=groups[r.customer().ageGroup().ordinal()];
        scored(result,"customer-age",selected/max,Map.of("selectedAgeSales",selected,"largestAgeGroupSales",max));
    }

    private void scoreDays(Request r,JsonNode sales,Map<String,Criterion> result) {
        if(r.schedule()==null||undecided(r.schedule().businessDays())) return;
        var amounts=values(sales,"MDWK_SELNG_AMT","WKEND_SELNG_AMT");
        if(amounts==null||amounts[0]+amounts[1]==0) { missing(result,"business-days");return; }
        int[] counts=dayCounts(r.quarter());
        double weekday=amounts[0]/counts[0],weekend=amounts[1]/counts[1];
        double ratio=switch(r.schedule().businessDays()) {
            case WEEKDAYS -> weekday/Math.max(weekday,weekend);
            case WEEKENDS -> weekend/Math.max(weekday,weekend);
            case ALL -> 1;
            default -> throw new IllegalStateException();
        };
        scored(result,"business-days",ratio,Map.of("weekdayDailySales",weekday,"weekendDailySales",weekend,
            "weekdayCount",(double)counts[0],"weekendCount",(double)counts[1]));
    }

    private List<ScheduleSuggestion> scoreTime(Request r,JsonNode sales,Map<String,Criterion> result) {
        if(r.schedule()==null||undecided(r.schedule().mainTime())) return List.of();
        var amounts=values(sales,"TMZON_00_06_SELNG_AMT","TMZON_06_11_SELNG_AMT","TMZON_11_14_SELNG_AMT",
            "TMZON_14_17_SELNG_AMT","TMZON_17_21_SELNG_AMT","TMZON_21_24_SELNG_AMT");
        if(amounts==null) { missing(result,"main-time");return List.of(); }
        double[] hourly={amounts[1]/5,amounts[2]/3,amounts[3]/3,amounts[4]/4,(amounts[5]+amounts[0])/9};
        double max=Arrays.stream(hourly).max().orElse(0);
        if(max==0) { missing(result,"main-time");return List.of(); }
        double selected=hourly[r.schedule().mainTime().ordinal()];
        scored(result,"main-time",selected/max,Map.of("selectedHourlySales",selected,"highestHourlySales",max));
        double score=result.get("main-time").score();
        int maxScore=rule("main-time").maxScore();
        if(!Boolean.TRUE.equals(r.schedule().canAdjustHours())||score>=maxScore) return List.of();
        for(int i=0;i<hourly.length;i++)
            if(hourly[i]==max) return List.of(new ScheduleSuggestion(r.schedule().mainTime(),TimeSlot.values()[i],score,maxScore));
        return List.of();
    }

    private void scoreDemand(Request r,JsonNode sales,JsonNode pedestrians,JsonNode residents,Map<String,Criterion> result) {
        var revenue=benchmark(r,SALES,sales,r.industryCode(),"THSMON_SELNG_AMT");
        if(revenue==null) missingBenchmark(result,"industry-sales");
        else scored(result,"industry-sales",revenue.percentile(),Map.of(
            "quarterlyIndustrySales",revenue.value(),"salesPercentile",round(revenue.percentile()*100),"salesPeerCount",(double)revenue.peerCount()));

        var foot=benchmark(r,PEDESTRIANS,pedestrians,null,"TOT_FLPOP_CO");
        var home=benchmark(r,RESIDENTS,residents,null,"TOT_REPOP_CO");
        if(foot==null||home==null) missingBenchmark(result,"potential-demand");
        else scored(result,"potential-demand",(foot.percentile()+home.percentile())/2,Map.of(
            "pedestrianPopulation",foot.value(),"pedestrianPercentile",round(foot.percentile()*100),"pedestrianPeerCount",(double)foot.peerCount(),
            "residentPopulation",home.value(),"residentPercentile",round(home.percentile()*100),"residentPeerCount",(double)home.peerCount()));
    }

    private void assessCompetition(Request r,JsonNode stores,Map<String,Criterion> result) {
        Double count=storeCount(stores);
        if(count==null) {
            missing(result,"competition");
            return;
        }
        var peers=benchmark(r,STORES,stores,r.industryCode(),"SIMILR_INDUTY_STOR_CO");
        Map<String,Double> evidence=peers==null?Map.of("sameIndustryStoreCount",count):Map.of(
            "sameIndustryStoreCount",count,"storeCountPercentile",round(peers.percentile()*100),"storePeerCount",(double)peers.peerCount());
        pendingRule(result,"competition",evidence);
    }

    private void scoreCapacity(Request r,Map<String,Criterion> result) {
        Double capacity=tableCapacity(r.strategy());
        Integer teams=r.demand()==null?null:r.demand().expectedDailyTeams();
        if(capacity==null||teams==null) return;
        scored(result,"capacity",capacity/teams,Map.of("plannedTableUsesPerDay",capacity,"expectedDailyTeams",teams.doubleValue()));
    }

    private void assessReadiness(Readiness readiness,Map<String,Criterion> result) {
        if(readiness!=null&&!undecided(readiness.experience())) pendingRule(result,"experience",Map.of());
        else result.put("experience",pending(rule("experience"),"MISSING_ANSWER","운영 경험 답변이 미정입니다."));
        if(readiness!=null&&!undecided(readiness.participation())) pendingRule(result,"participation",Map.of());
        else result.put("participation",pending(rule("participation"),"MISSING_ANSWER","운영 참여 답변이 미정입니다."));
    }

    private record Benchmark(double value,double percentile,long peerCount) {}

    private Benchmark benchmark(Request r,String dataset,JsonNode target,String industry,String field) {
        Double value=number(target,field);
        if(value==null) return null;
        String type=target.path("TRDAR_SE_CD").asText("");
        if(type.isBlank()) return null;
        var peers=store.assessmentPeers(dataset,r.quarter(),r.districtCode(),industry,type,field);
        return percentile(value,peers.stream().map(AssessmentService::number).toList());
    }

    private static Benchmark percentile(double value,List<Double> peers) {
        int count=0, lower=0, tied=0;
        for(Double peer:peers) {
            if(peer==null) continue;
            count++;
            if(peer<value) lower++;
            else if(peer==value) tied++;
        }
        return count<MIN_PEERS?null:new Benchmark(value,(lower+tied*0.5)/count,count);
    }

    private Map<String,Double> indicators(Request r,JsonNode sales,JsonNode stores,JsonNode pedestrians,JsonNode residents) {
        Map<String,Double> values=new LinkedHashMap<>();
        Double monthly=monthlySales(sales,stores),amount=number(sales,"THSMON_SELNG_AMT"),count=number(sales,"THSMON_SELNG_CO");
        if(monthly!=null) values.put("monthlySalesPerStore",round(monthly));
        if(amount!=null&&count!=null&&count>0) values.put("averagePaymentAmount",round(amount/count));
        putIndicator(values,"pedestrianPopulation",number(pedestrians,"TOT_FLPOP_CO"));
        putIndicator(values,"residentPopulation",number(residents,"TOT_REPOP_CO"));
        putIndicator(values,"sameIndustryStoreCount",storeCount(stores));
        putIndicator(values,"plannedTableUsesPerDay",tableCapacity(r.strategy()));
        if(r.demand()!=null&&r.demand().targetMonthlySales()!=null&&r.demand().monthlyOperatingDays()!=null) {
            double dailyTarget=(double)r.demand().targetMonthlySales()/r.demand().monthlyOperatingDays();
            values.put("targetDailySales",round(dailyTarget));
            if(r.demand().expectedDailyTeams()!=null)
                values.put("targetSalesPerTeam",round(dailyTarget/r.demand().expectedDailyTeams()));
        }
        return values;
    }

    private static void putIndicator(Map<String,Double> values,String key,Double amount) {
        if(amount!=null) values.put(key,round(amount));
    }
    private static Double tableCapacity(Strategy strategy) {
        return strategy==null||strategy.tableCount()==null||strategy.dailyTurns()==null
            ?null:strategy.tableCount()*strategy.dailyTurns().doubleValue();
    }
    private Source source(String dataset,List<RecordStore.AssessmentRow> rows) {
        String collectedAt=rows.stream().map(RecordStore.AssessmentRow::collectedAt).max(String::compareTo).orElse(null);
        return new Source(dataset,catalog.get(dataset).sourceUrl(),collectedAt,rows.size());
    }
    private static JsonNode single(List<RecordStore.AssessmentRow> rows) { return rows.size()==1?rows.get(0).payload():null; }
    private static Double monthlySales(JsonNode sales,JsonNode stores) {
        Double amount=number(sales,"THSMON_SELNG_AMT"),count=storeCount(stores);
        return amount==null||count==null||count<=0?null:amount/3/count;
    }
    private static Double storeCount(JsonNode stores) {
        // 전체 매출의 분모는 일반 점포가 아닌 프랜차이즈를 포함한 전체 점포입니다.
        return number(stores,"SIMILR_INDUTY_STOR_CO");
    }
    private static Double number(JsonNode row,String field) {
        if(row==null||!row.hasNonNull(field)) return null;
        var value=row.get(field);
        if(!value.isNumber()&&!value.isTextual()) return null;
        return number(value.asText());
    }
    private static Double number(String value) {
        if(value==null) return null;
        try {
            double number=Double.parseDouble(value);
            return Double.isFinite(number)&&number>=0?number:null;
        } catch(NumberFormatException e) { return null; }
    }
    private static double[] values(JsonNode row,String... fields) {
        double[] result=new double[fields.length];
        for(int i=0;i<fields.length;i++) { Double n=number(row,fields[i]);if(n==null) return null;result[i]=n; }
        return result;
    }
    private static int[] dayCounts(String quarter) {
        LocalDate start=LocalDate.of(Integer.parseInt(quarter.substring(0,4)),(quarter.charAt(4)-'1')*3+1,1);
        int[] counts={0,0};
        for(LocalDate d=start;d.isBefore(start.plusMonths(3));d=d.plusDays(1))
            counts[d.getDayOfWeek()==DayOfWeek.SATURDAY||d.getDayOfWeek()==DayOfWeek.SUNDAY?1:0]++;
        return counts;
    }
    private static boolean undecided(Enum<?> value) { return value==null||value.name().equals("UNDECIDED"); }
    private static Rule rule(String id) { return RULES.stream().filter(r->r.id().equals(id)).findFirst().orElseThrow(); }
    private static Criterion pending(Rule rule,String status,String reason) {
        return new Criterion(rule.id(),rule.name(),null,rule.maxScore(),status,reason,rule.formula(),Map.of());
    }
    private static void missing(Map<String,Criterion> result,String id) {
        result.put(id,pending(rule(id),"MISSING_DATA","동일 분기·상권·업종의 비교 값이 없거나 유효하지 않습니다. 수집 현황과 원본 필드를 확인하세요."));
    }
    private static void missingBenchmark(Map<String,Criterion> result,String id) {
        result.put(id,pending(rule(id),"MISSING_DATA","대상 값 또는 동일 분기·상권 유형의 유효한 비교 상권 "+MIN_PEERS+"곳이 필요합니다."));
    }
    private static void pendingRule(Map<String,Criterion> result,String id,Map<String,Double> evidence) {
        var rule=rule(id);
        result.put(id,new Criterion(id,rule.name(),null,rule.maxScore(),"PENDING_RULE",rule.formula(),rule.formula(),evidence));
    }
    private static void scored(Map<String,Criterion> result,String id,double ratio,Map<String,Double> evidence) {
        var rule=rule(id);
        result.put(id,new Criterion(id,rule.name(),round(Math.max(0,Math.min(1,ratio))*rule.maxScore()),rule.maxScore(),
            "SCORED","초기 설계 규칙으로 계산한 참고 점수입니다.",rule.formula(),evidence));
    }
    private static double round(double value) { return Math.round(value*100)/100.0; }
}
