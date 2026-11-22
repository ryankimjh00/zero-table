package org.monithub.zerotable;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value="/api/v1/assessments",produces="application/json")
@Tag(name="창업 계획 평가",description="설문과 저장된 상권 자료를 비교해 점수, 참고 지표, 영업시간 대안을 제공합니다.")
public class AssessmentController {
    private final AssessmentService service;
    public AssessmentController(AssessmentService service) { this.service=service; }

    @GetMapping("/rules")
    @Operation(summary="100점 배점과 계산 규칙",description="세부 배점과 초안 산식을 제공합니다. 최대 56점분을 계산할 수 있습니다.")
    public AssessmentModels.RuleSet rules() { return service.rules(); }

    @PostMapping(consumes="application/json")
    @Operation(summary="창업 설문 점수 계산",description="1·2·5번은 선택형, 3·4번은 숫자 입력입니다. 미정은 null 또는 UNDECIDED로 보냅니다. 미정·자료 누락·기준 협의 중인 항목은 보류합니다. 전체 평가 전 totalScore는 null입니다.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(content=@Content(examples=@ExampleObject(value="""
        {"quarter":"20262","districtCode":"3111083","industryCode":"CS100010",
         "customer":{"type":"WORKER","ageGroup":"TWENTIES","visitPurpose":"WORK_SCHOOL"},
         "schedule":{"businessDays":"WEEKDAYS","mainTime":"DINNER","canAdjustHours":true},
         "demand":{"targetMonthlySales":20000000,"monthlyOperatingDays":24,"expectedDailyTeams":18},
         "strategy":{"menuPrice":12000,"areaPyeong":10,"seatCount":15,"tableCount":5,"dailyTurns":3,"startupCapital":50000000,"monthlyCapital":3000000},
         "readiness":{"experience":"EMPLOYEE","participation":"FULL_TIME"}}
        """)))
    @ApiResponse(responseCode="200",description="계산 결과. 자료가 없어도 정상 부분 결과를 반환합니다.",useReturnTypeSchema=true)
    @ApiResponse(responseCode="400",description="선택지·숫자 범위·JSON 형식 오류",content=@Content(schema=@Schema(implementation=Models.Error.class)))
    public AssessmentModels.Result assess(@Valid @RequestBody AssessmentModels.Request request) { return service.assess(request); }
}
