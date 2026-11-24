package org.monithub.zerotable;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class AssessmentModels {
    private AssessmentModels() {}

    public enum CustomerType { WORKER, STUDENT, RESIDENT, TOURIST, UNDECIDED }
    public enum AgeGroup { TEENS, TWENTIES, THIRTIES, FORTIES, FIFTY_PLUS, UNDECIDED }
    public enum VisitPurpose { PASSING_BY, WORK_SCHOOL, REGULAR_LOCAL, DESTINATION, UNDECIDED }
    public enum BusinessDays { WEEKDAYS, WEEKENDS, ALL, UNDECIDED }
    public enum TimeSlot { MORNING, LUNCH, AFTERNOON, DINNER, LATE_NIGHT, UNDECIDED }
    public enum Experience { NONE, EMPLOYEE, MANAGER, OWNER, UNDECIDED }
    public enum Participation { FULL_TIME, THREE_FOUR_DAYS, WEEKENDS, UNDECIDED }

    @Schema(name="AssessmentRequest",description="1·2·5번은 선택형, 3·4번은 숫자 입력입니다. null 또는 UNDECIDED는 미정입니다. 상권의 업종 매출은 같은 분기·상권 유형·업종과 비교하고, 인구는 같은 분기·상권 유형과 비교합니다.")
    public record Request(
        @NotBlank @Pattern(regexp="20\\d{2}[1-4]") @Schema(example="20262") String quarter,
        @NotBlank @Pattern(regexp="\\d{7}") @Schema(example="3111083") String districtCode,
        @NotBlank @Pattern(regexp="CS\\d{6}") @Schema(example="CS100010") String industryCode,
        @Valid Customer customer, @Valid Schedule schedule, @Valid Demand demand,
        @Valid Strategy strategy, @Valid Readiness readiness) {}

    public record Customer(
        @Schema(example="WORKER",description="직장인과 지역 주민은 상권별 직장인구·상주인구 밀도로 평가합니다. 학생과 관광객은 보류합니다.") CustomerType type,
        @Schema(example="TWENTIES",description="FIFTY_PLUS는 50대와 60대 이상을 합산합니다.") AgeGroup ageGroup,
        @Schema(example="WORK_SCHOOL") VisitPurpose visitPurpose) {}
    public record Schedule(
        @Schema(example="WEEKDAYS") BusinessDays businessDays,
        @Schema(example="LUNCH",description="오전 06~11, 점심 11~14, 오후 14~17, 저녁 17~21, 심야 21~06시") TimeSlot mainTime,
        @Schema(example="true",description="영업시간 조정 가능 여부. 가능으로 답했을 때 매출이 더 높은 시간대를 안내합니다.") Boolean canAdjustHours) {}
    public record Demand(
        @Min(1) @Max(1_000_000_000_000L) @Schema(example="20000000",description="목표 월 매출, 원. 미정은 null.") Long targetMonthlySales,
        @Min(1) @Max(31) @Schema(example="24",description="월 영업일 수") Integer monthlyOperatingDays,
        @Min(1) @Max(100000) @Schema(example="18",description="하루 예상 방문 팀 수") Integer expectedDailyTeams) {}
    public record Strategy(
        @Min(1) @Max(1_000_000_000L) @Schema(example="12000",description="대표 메뉴 1개 가격, 원. 객단가와 다릅니다.") Long menuPrice,
        @DecimalMin("0.1") @DecimalMax("10000") @Schema(example="10",description="예상 면적, 평") BigDecimal areaPyeong,
        @Min(1) @Max(10000) @Schema(example="15") Integer seatCount,
        @Min(1) @Max(10000) @Schema(example="5") Integer tableCount,
        @DecimalMin("0.1") @DecimalMax("100") @Schema(example="3",description="예상 하루 테이블 회전 수") BigDecimal dailyTurns,
        @Min(0) @Max(1_000_000_000_000L) @Schema(example="50000000",description="사용 가능한 초기 자본, 원. 비용이 아닙니다.") Long startupCapital,
        @Min(0) @Max(1_000_000_000_000L) @Schema(example="3000000",description="사용 가능한 월 운영자금, 원. 실제 운영비가 아닙니다.") Long monthlyCapital) {}
    public record Readiness(
        @Schema(example="EMPLOYEE") Experience experience,
        @Schema(example="FULL_TIME") Participation participation) {}

    @Schema(name="AssessmentResult",description="미평가 항목은 점수가 null입니다. 종합 화면에는 평가된 항목을 100점 만점으로 환산한 scoreOutOf100과 평가 배점 비율을 함께 표시합니다.")
    public record Result(@Schema(example="2026-11-24-v3") String ruleVersion, @Schema(example="PARTIAL") String status,
        @Schema(nullable=true,description="전체 평가 전에는 null") Double totalScore,
        @Schema(nullable=true,example="60",description="100 × earnedScore ÷ availablePoints. 평가된 항목이 0개면 null입니다.") Double scoreOutOf100,
        @Schema(example="36.60") double earnedScore, @Schema(example="61") int availablePoints, @Schema(example="100") int maxScore,
        @Schema(example="61",description="전체 100점 중 평가 가능한 배점 비율") double coveragePercent,
        List<Category> categories, Map<String,Double> indicators, List<Source> sources,
        List<ScheduleSuggestion> suggestions, List<String> notes) {}
    public record ScheduleSuggestion(TimeSlot currentTime, TimeSlot suggestedTime,
                                     double currentTimeScore, double suggestedTimeScore) {}
    public record Category(String id, String name, Double score, int availablePoints, int maxScore, List<Criterion> criteria) {}
    public record Criterion(String id, String name, Double score, int maxScore,
                            @Schema(allowableValues={"SCORED","MISSING_ANSWER","MISSING_DATA","UNSUPPORTED_DATA","PENDING_RULE"}) String status,
                            String reason, String formula, Map<String,Double> evidence) {}
    public record Source(String dataset, String sourceUrl, String collectedAt, long matchingRecords) {}
    public record RuleSet(String version, int maxScore, int currentlySupportedPoints, String totalScorePolicy, List<Rule> criteria) {}
    public record Rule(String category, String id, String name, int maxScore, boolean supported, String formula) {}
}
