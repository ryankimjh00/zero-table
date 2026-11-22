package org.monithub.zerotable;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value="/api/v1",produces="application/json")
@Validated
@Tag(name="공공데이터",description="인증 없이 공개 조회합니다. 원본 API 키는 서버에서 주입합니다.")
@ApiResponse(responseCode="200",description="정상 응답",useReturnTypeSchema=true)
@ApiResponse(responseCode="400",description="요청 형식 오류",content=@Content(schema=@Schema(implementation=Models.Error.class)))
@ApiResponse(responseCode="404",description="데이터셋 없음",content=@Content(schema=@Schema(implementation=Models.Error.class)))
public class ApiController {
    private final Catalog catalog;
    private final ApiKeys keys;
    private final RecordStore store;
    private final UpstreamClient upstream;
    public ApiController(Catalog catalog,ApiKeys keys,RecordStore store,UpstreamClient upstream) {
        this.catalog=catalog;this.keys=keys;this.store=store;this.upstream=upstream;
    }
    @GetMapping("/datasets")
    @Operation(summary="데이터 목록·원본 필드·수집 현황",description="키 설정 여부는 유효성 검증 결과가 아닙니다. 실제 성공/실패는 collection-runs에서 확인합니다.")
    public List<Models.DatasetView> datasets() {
        return catalog.all().stream().map(d->new Models.DatasetView(d,keys.configured(d.keyId()),store.count(d.id()),store.lastCollected(d.id()))).toList();
    }
    @GetMapping("/datasets/{dataset}")
    @Operation(summary="데이터셋 상세·필드 사전")
    public Models.DatasetView dataset(@Parameter(example="seoul_estimated_sales") @PathVariable String dataset) {
        var d=catalog.get(dataset);return new Models.DatasetView(d,keys.configured(d.keyId()),store.count(d.id()),store.lastCollected(d.id()));
    }
    @GetMapping("/datasets/{dataset}/records")
    @Operation(summary="SQLite 수집 데이터 조회",description="items에는 제공기관 원본 필드명과 값이 보존됩니다. total=0이면 수집 이력도 확인하세요. quarter·districtCode·industryCode로 서울시 자료를 연결합니다.")
    public Models.Page records(@Parameter(example="seoul_estimated_sales") @PathVariable String dataset,
        @RequestParam(defaultValue="1") @Min(1) @Max(100000) int page,
        @RequestParam(defaultValue="100") @Min(1) @Max(1000) int size,
        @Parameter(description="기준 분기. 예: 20262") @RequestParam(required=false) @Pattern(regexp="20\\d{2}[1-4]") String quarter,
        @Parameter(description="서울시 TRDAR_CD. 예: 3111083") @RequestParam(required=false) String districtCode,
        @Parameter(description="서울시 SVC_INDUTY_CD 또는 소상공인 indsSclsCd. 예: CS100010") @RequestParam(required=false) String industryCode,
        @Parameter(description="상권영역/개별 점포의 자치구 코드. 예: 11680") @RequestParam(required=false) String regionCode,
        @Parameter(description="부동산원 STATBL_ID. 예: A_2024_00900") @RequestParam(required=false) String tableId) {
        catalog.get(dataset);return store.query(dataset,page,size,quarter,districtCode,industryCode,regionCode,tableId);
    }
    @GetMapping("/proxy/{dataset}")
    @Parameters({
        @Parameter(name="quarter",in=ParameterIn.QUERY,description="서울시 지원 데이터셋의 기준 분기. 예: 20262 (상주인구/상권영역 제외)"),
        @Parameter(name="STATBL_ID",in=ParameterIn.QUERY,description="부동산원 통계표 ID. 예: A_2024_00900"),
        @Parameter(name="DTACYCLE_CD",in=ParameterIn.QUERY,description="부동산원 수록주기. 예: YY"),
        @Parameter(name="WRTTIME_IDTFR_ID",in=ParameterIn.QUERY,description="부동산원 기준시점. 예: 2025"),
        @Parameter(name="START_WRTTIME",in=ParameterIn.QUERY,description="부동산원 시작시점"),
        @Parameter(name="END_WRTTIME",in=ParameterIn.QUERY,description="부동산원 종료시점"),
        @Parameter(name="CLS_ID",in=ParameterIn.QUERY,description="부동산원 지역/분류 ID"),
        @Parameter(name="ITM_ID",in=ParameterIn.QUERY,description="부동산원 항목 ID"),
        @Parameter(name="GRP_ID",in=ParameterIn.QUERY,description="부동산원 그룹 ID"),
        @Parameter(name="STATBL_NM",in=ParameterIn.QUERY,description="부동산원 통계표명 검색"),
        @Parameter(name="divId",in=ParameterIn.QUERY,description="소상공인 지역 구분(ctprvnCd/signguCd/adongCd). 기본 ctprvnCd"),
        @Parameter(name="key",in=ParameterIn.QUERY,description="소상공인 지역 코드(서버 인증키와 별개). 기본 11"),
        @Parameter(name="indsLclsCd",in=ParameterIn.QUERY,description="소상공인 업종 대분류"),
        @Parameter(name="indsMclsCd",in=ParameterIn.QUERY,description="소상공인 업종 중분류"),
        @Parameter(name="indsSclsCd",in=ParameterIn.QUERY,description="소상공인 업종 소분류")
    })
    @Operation(summary="원본 API 프록시",description="허용된 데이터셋만 호출합니다. page/size는 공통 페이징이며 추가 쿼리는 데이터셋 parameters에 명시된 원본 파라미터만 허용합니다. 예: ?page=1&size=100&quarter=20262. 부동산원 데이터: ?STATBL_ID=A_2024_00900&DTACYCLE_CD=YY&WRTTIME_IDTFR_ID=2025. 응답은 10분 캐시하며 실제 외부 호출은 서버 전체 분당 60회로 제한합니다.")
    @ApiResponse(responseCode="429",description="원본 호출 한도 초과",content=@Content(schema=@Schema(implementation=Models.Error.class)))
    @ApiResponse(responseCode="502",description="제공기관 API 오류",content=@Content(schema=@Schema(implementation=Models.Error.class)))
    @ApiResponse(responseCode="503",description="서버 원본 API 키 미설정",content=@Content(schema=@Schema(implementation=Models.Error.class)))
    public Models.Page proxy(@Parameter(example="seoul_estimated_sales") @PathVariable String dataset,
        @RequestParam(defaultValue="1") @Min(1) @Max(100000) int page,
        @RequestParam(defaultValue="100") @Min(1) @Max(1000) int size,
        @Parameter(hidden=true) @RequestParam Map<String,String> parameters) {
        var params=new TreeMap<>(parameters);params.remove("page");params.remove("size");
        return upstream.fetch(catalog.get(dataset),params,page,size,true);
    }
    @GetMapping("/collection-runs")
    @Operation(summary="최근 수집 이력",description="COMPLETE: 요청 범위 전체 수집, PARTIAL: maxPages까지 저장(다음은 nextPage), FAILED/INTERRUPTED: 실패 전 페이지는 보존. processed는 갱신 포함 처리 건수이며 고유 저장 건수는 datasets를 확인합니다. 수집 실행은 운영자 CLI로 수행합니다.")
    public List<Models.Run> runs(@RequestParam(defaultValue="20") @Min(1) @Max(100) int limit) { return store.runs(limit); }
}
