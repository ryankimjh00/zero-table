# 수집 가능 데이터 목록

이 파일은 catalog.json에서 생성합니다. `./scripts/export-docs.sh`로 갱신하세요.

## 소상공인시장진흥공단 상가정보

- ID: `small_business_stores`
- 제공기관: 소상공인시장진흥공단
- 원본: [공식 문서](https://www.data.go.kr/data/15012005/openapi.do)
- 서비스: `storeListInDong`
- 설명: 전국 개별 상가의 상호·주소·업종·좌표. 기본 수집 범위는 서울이며 다른 지역 코드로 확장할 수 있습니다.
- 원본 요청 파라미터: `divId, key, indsLclsCd, indsMclsCd, indsSclsCd`
- 기본값: `{divId=ctprvnCd, key=11}`

| 원본 필드 | 설명 |
| --- | --- |
| `bizesId` | 상가업소번호 |
| `bizesNm` | 상호명 |
| `brchNm` | 지점명 |
| `indsLclsCd` | 상권업종대분류코드 |
| `indsLclsNm` | 상권업종대분류명 |
| `indsMclsCd` | 상권업종중분류코드 |
| `indsMclsNm` | 상권업종중분류명 |
| `indsSclsCd` | 상권업종소분류코드 |
| `indsSclsNm` | 상권업종소분류명 |
| `ksicCd` | 표준산업분류코드 |
| `ksicNm` | 표준산업분류명 |
| `ctprvnCd` | 시도코드 |
| `ctprvnNm` | 시도명 |
| `signguCd` | 시군구코드 |
| `signguNm` | 시군구명 |
| `adongCd` | 행정동코드 |
| `adongNm` | 행정동명 |
| `ldongCd` | 법정동코드 |
| `ldongNm` | 법정동명 |
| `lnoCd` | PNU코드 |
| `plotSctCd` | 대지구분코드 |
| `plotSctNm` | 대지구분명 |
| `lnoMnno` | 지번본번지 |
| `lnoSlno` | 지번부번지 |
| `lnoAdr` | 지번주소 |
| `rdnmCd` | 도로명코드 |
| `rdnm` | 도로명 |
| `bldMnno` | 건물본번지 |
| `bldSlno` | 건물부번지 |
| `bldMngNo` | 건물관리번호 |
| `bldNm` | 건물명 |
| `rdnmAdr` | 도로명주소 |
| `oldZipcd` | 구우편번호 |
| `newZipcd` | 신우편번호 |
| `dongNo` | 동정보 |
| `flrNo` | 층정보 |
| `hoNo` | 호정보 |
| `lon` | 경도(WGS84) |
| `lat` | 위도(WGS84) |

## 한국부동산원 부동산통계

- ID: `reb_real_estate_statistics`
- 제공기관: 한국부동산원
- 원본: [공식 문서](https://www.reb.or.kr/r-one/portal/openapi/openApiDevPage.do)
- 서비스: `SttsApiTblData`
- 설명: 통계표별 지가지수·지가변동률·주택가격·상업용부동산 임대동향 등의 수록값. 실제 제공 항목은 통계표 목록·항목 API로 확인합니다. 기본 수집 예시는 연간 지역별 지가지수 2025년이며 전체 부동산 통계를 의미하지 않습니다.
- 원본 요청 파라미터: `STATBL_ID, DTACYCLE_CD, WRTTIME_IDTFR_ID, START_WRTTIME, END_WRTTIME, GRP_ID, CLS_ID, ITM_ID`
- 기본값: `{}`

| 원본 필드 | 설명 |
| --- | --- |
| `STATBL_ID` | 통계표 ID |
| `DTACYCLE_CD` | 수록주기 코드(YY/QQ/MM) |
| `WRTTIME_IDTFR_ID` | 기준시점 코드 |
| `GRP_ID` | 그룹 ID |
| `GRP_NM` | 그룹명 |
| `CLS_ID` | 지역/분류 ID |
| `CLS_NM` | 지역/분류명 |
| `ITM_ID` | 항목 ID |
| `ITM_NM` | 항목명 |
| `DTA_VAL` | 통계 수치 |
| `UI_NM` | 단위 |
| `GRP_FULLNM` | 전체 그룹명 |
| `CLS_FULLNM` | 전체 지역/분류명 |
| `ITM_FULLNM` | 전체 항목명 |
| `WRTTIME_DESC` | 기준시점 설명 |

## 서울시 추정매출

- ID: `seoul_estimated_sales`
- 제공기관: 서울특별시 열린데이터광장
- 원본: [공식 문서](https://data.seoul.go.kr/dataList/OA-15572/S/1/datasetView.do)
- 서비스: `VwsmTrdarSelngQq`
- 설명: 상권·분기·업종별 추정매출 금액(원)·건수, 요일·시간대·성별·연령별 매출. 2026-07-03 이후 2021년 이후 자료만 제공한다는 공식 공지가 있습니다.
- 원본 요청 파라미터: `quarter`
- 기본값: `{}`

| 원본 필드 | 설명 |
| --- | --- |
| `STDR_YYQU_CD` | 기준 년분기 코드 |
| `TRDAR_SE_CD` | 상권 유형 코드 |
| `TRDAR_SE_CD_NM` | 상권 유형명 |
| `TRDAR_CD` | 상권 코드 |
| `TRDAR_CD_NM` | 상권명 |
| `SVC_INDUTY_CD` | 서비스 업종 코드 |
| `SVC_INDUTY_CD_NM` | 서비스 업종명 |
| `THSMON_SELNG_AMT` | 분기 내 매출 금액(원, 원본 필드명 유지) |
| `THSMON_SELNG_CO` | 분기 내 매출 건수(원본 필드명 유지) |
| `MDWK_SELNG_AMT` | 주중 매출 금액(원) |
| `WKEND_SELNG_AMT` | 주말 매출 금액(원) |
| `MON_SELNG_AMT` | 월요일 매출 금액(원) |
| `TUES_SELNG_AMT` | 화요일 매출 금액(원) |
| `WED_SELNG_AMT` | 수요일 매출 금액(원) |
| `THUR_SELNG_AMT` | 목요일 매출 금액(원) |
| `FRI_SELNG_AMT` | 금요일 매출 금액(원) |
| `SAT_SELNG_AMT` | 토요일 매출 금액(원) |
| `SUN_SELNG_AMT` | 일요일 매출 금액(원) |
| `TMZON_00_06_SELNG_AMT` | 00~06시 매출 금액(원) |
| `TMZON_06_11_SELNG_AMT` | 06~11시 매출 금액(원) |
| `TMZON_11_14_SELNG_AMT` | 11~14시 매출 금액(원) |
| `TMZON_14_17_SELNG_AMT` | 14~17시 매출 금액(원) |
| `TMZON_17_21_SELNG_AMT` | 17~21시 매출 금액(원) |
| `TMZON_21_24_SELNG_AMT` | 21~24시 매출 금액(원) |
| `ML_SELNG_AMT` | 남성 매출 금액(원) |
| `FML_SELNG_AMT` | 여성 매출 금액(원) |
| `AGRDE_10_SELNG_AMT` | 10대 매출 금액(원) |
| `AGRDE_20_SELNG_AMT` | 20대 매출 금액(원) |
| `AGRDE_30_SELNG_AMT` | 30대 매출 금액(원) |
| `AGRDE_40_SELNG_AMT` | 40대 매출 금액(원) |
| `AGRDE_50_SELNG_AMT` | 50대 매출 금액(원) |
| `AGRDE_60_ABOVE_SELNG_AMT` | 60대 이상 매출 금액(원) |
| `MDWK_SELNG_CO` | 주중 매출 건수 |
| `WKEND_SELNG_CO` | 주말 매출 건수 |
| `MON_SELNG_CO` | 월요일 매출 건수 |
| `TUES_SELNG_CO` | 화요일 매출 건수 |
| `WED_SELNG_CO` | 수요일 매출 건수 |
| `THUR_SELNG_CO` | 목요일 매출 건수 |
| `FRI_SELNG_CO` | 금요일 매출 건수 |
| `SAT_SELNG_CO` | 토요일 매출 건수 |
| `SUN_SELNG_CO` | 일요일 매출 건수 |
| `TMZON_00_06_SELNG_CO` | 00~06시 매출 건수 |
| `TMZON_06_11_SELNG_CO` | 06~11시 매출 건수 |
| `TMZON_11_14_SELNG_CO` | 11~14시 매출 건수 |
| `TMZON_14_17_SELNG_CO` | 14~17시 매출 건수 |
| `TMZON_17_21_SELNG_CO` | 17~21시 매출 건수 |
| `TMZON_21_24_SELNG_CO` | 21~24시 매출 건수 |
| `ML_SELNG_CO` | 남성 매출 건수 |
| `FML_SELNG_CO` | 여성 매출 건수 |
| `AGRDE_10_SELNG_CO` | 10대 매출 건수 |
| `AGRDE_20_SELNG_CO` | 20대 매출 건수 |
| `AGRDE_30_SELNG_CO` | 30대 매출 건수 |
| `AGRDE_40_SELNG_CO` | 40대 매출 건수 |
| `AGRDE_50_SELNG_CO` | 50대 매출 건수 |
| `AGRDE_60_ABOVE_SELNG_CO` | 60대 이상 매출 건수 |

## 서울시 길단위인구

- ID: `seoul_pedestrian_population`
- 제공기관: 서울특별시 열린데이터광장
- 원본: [공식 문서](https://data.seoul.go.kr/dataList/OA-15568/S/1/datasetView.do)
- 서비스: `VwsmTrdarFlpopQq`
- 설명: 상권·분기별 총 유동인구 및 성별·연령·요일·시간대별 인구. 길 하나하나의 실시간 위치 데이터가 아닌 상권 단위 집계입니다.
- 원본 요청 파라미터: `quarter`
- 기본값: `{}`

| 원본 필드 | 설명 |
| --- | --- |
| `STDR_YYQU_CD` | 기준 년분기 코드 |
| `TRDAR_SE_CD` | 상권 유형 코드 |
| `TRDAR_SE_CD_NM` | 상권 유형명 |
| `TRDAR_CD` | 상권 코드 |
| `TRDAR_CD_NM` | 상권명 |
| `TOT_FLPOP_CO` | 전체 유동인구 수 |
| `ML_FLPOP_CO` | 남성 유동인구 수 |
| `FML_FLPOP_CO` | 여성 유동인구 수 |
| `AGRDE_10_FLPOP_CO` | 10대 유동인구 수 |
| `AGRDE_20_FLPOP_CO` | 20대 유동인구 수 |
| `AGRDE_30_FLPOP_CO` | 30대 유동인구 수 |
| `AGRDE_40_FLPOP_CO` | 40대 유동인구 수 |
| `AGRDE_50_FLPOP_CO` | 50대 유동인구 수 |
| `AGRDE_60_ABOVE_FLPOP_CO` | 60대 이상 유동인구 수 |
| `TMZON_00_06_FLPOP_CO` | 00~06시 유동인구 수 |
| `TMZON_06_11_FLPOP_CO` | 06~11시 유동인구 수 |
| `TMZON_11_14_FLPOP_CO` | 11~14시 유동인구 수 |
| `TMZON_14_17_FLPOP_CO` | 14~17시 유동인구 수 |
| `TMZON_17_21_FLPOP_CO` | 17~21시 유동인구 수 |
| `TMZON_21_24_FLPOP_CO` | 21~24시 유동인구 수 |
| `MON_FLPOP_CO` | 월요일 유동인구 수 |
| `TUES_FLPOP_CO` | 화요일 유동인구 수 |
| `WED_FLPOP_CO` | 수요일 유동인구 수 |
| `THUR_FLPOP_CO` | 목요일 유동인구 수 |
| `FRI_FLPOP_CO` | 금요일 유동인구 수 |
| `SAT_FLPOP_CO` | 토요일 유동인구 수 |
| `SUN_FLPOP_CO` | 일요일 유동인구 수 |

## 서울시 점포

- ID: `seoul_stores`
- 제공기관: 서울특별시 열린데이터광장
- 원본: [공식 문서](https://data.seoul.go.kr/dataList/OA-15577/S/1/datasetView.do)
- 서비스: `VwsmTrdarStorQq`
- 설명: 상권·분기·업종별 점포 수, 유사 업종 점포 수, 프랜차이즈, 개폐업 점포 수와 비율. 개별 점포 주소는 소상공인 데이터에서 확인합니다.
- 원본 요청 파라미터: `quarter`
- 기본값: `{}`

| 원본 필드 | 설명 |
| --- | --- |
| `STDR_YYQU_CD` | 기준 년분기 코드 |
| `TRDAR_SE_CD` | 상권 유형 코드 |
| `TRDAR_SE_CD_NM` | 상권 유형명 |
| `TRDAR_CD` | 상권 코드 |
| `TRDAR_CD_NM` | 상권명 |
| `SVC_INDUTY_CD` | 서비스 업종 코드 |
| `SVC_INDUTY_CD_NM` | 서비스 업종명 |
| `SIMILR_INDUTY_STOR_CO` | 전체 점포 수(일반 + 프랜차이즈) |
| `STOR_CO` | 일반 점포 수(프랜차이즈 제외) |
| `FRC_STOR_CO` | 프랜차이즈 점포 수 |
| `OPBIZ_RT` | 개업률 |
| `OPBIZ_STOR_CO` | 개업 점포 수 |
| `CLSBIZ_RT` | 폐업률 |
| `CLSBIZ_STOR_CO` | 폐업 점포 수 |

## 서울시 상권영역

- ID: `seoul_commercial_districts`
- 제공기관: 서울특별시 열린데이터광장
- 원본: [공식 문서](https://data.seoul.go.kr/dataList/OA-15560/S/1/datasetView.do)
- 서비스: `TbgisTrdarRelm`
- 설명: 상권 코드·이름·유형·자치구·행정동·면적·대표 좌표. 좌표계 EPSG:5181이며 위경도가 아닙니다. API에는 폴리곤이 없고 경계 도형은 공식 SHP 파일을 별도 사용해야 합니다.
- 원본 요청 파라미터: ``
- 기본값: `{}`

| 원본 필드 | 설명 |
| --- | --- |
| `TRDAR_SE_CD` | 상권 유형 코드 |
| `TRDAR_SE_CD_NM` | 상권 유형명 |
| `TRDAR_CD` | 상권 코드 |
| `TRDAR_CD_NM` | 상권명 |
| `XCNTS_VALUE` | X좌표(EPSG:5181) |
| `YDNTS_VALUE` | Y좌표(EPSG:5181) |
| `SIGNGU_CD` | 자치구 코드 |
| `SIGNGU_CD_NM` | 자치구명 |
| `ADSTRD_CD` | 행정동 코드 |
| `ADSTRD_CD_NM` | 행정동명 |
| `RELM_AR` | 영역 면적 |

## 서울시 상주인구

- ID: `seoul_resident_population`
- 제공기관: 서울특별시 열린데이터광장
- 원본: [공식 문서](https://data.seoul.go.kr/dataList/OA-15584/S/1/datasetView.do)
- 서비스: `VwsmTrdarRepopQq`
- 설명: 상권·분기별 상주인구, 성별·연령별 인구, 총가구·아파트·비아파트 가구. 공식 안내상 4분기에 갱신하고 다음 해 1~3분기 값이 동일할 수 있습니다. 원본은 분기 요청 필터를 지원하지 않으므로 전체 제공 분기를 수집하고 SQLite 조회에서 quarter로 필터합니다.
- 원본 요청 파라미터: ``
- 기본값: `{}`

| 원본 필드 | 설명 |
| --- | --- |
| `STDR_YYQU_CD` | 기준 년분기 코드 |
| `TRDAR_SE_CD` | 상권 유형 코드 |
| `TRDAR_SE_CD_NM` | 상권 유형명 |
| `TRDAR_CD` | 상권 코드 |
| `TRDAR_CD_NM` | 상권명 |
| `TOT_REPOP_CO` | 전체 상주인구 수 |
| `ML_REPOP_CO` | 남성 상주인구 수 |
| `FML_REPOP_CO` | 여성 상주인구 수 |
| `AGRDE_10_REPOP_CO` | 10대 상주인구 수 |
| `AGRDE_20_REPOP_CO` | 20대 상주인구 수 |
| `AGRDE_30_REPOP_CO` | 30대 상주인구 수 |
| `AGRDE_40_REPOP_CO` | 40대 상주인구 수 |
| `AGRDE_50_REPOP_CO` | 50대 상주인구 수 |
| `AGRDE_60_ABOVE_REPOP_CO` | 60대 이상 상주인구 수 |
| `MAG_10_REPOP_CO` | 남성 10대 상주인구 수 |
| `MAG_20_REPOP_CO` | 남성 20대 상주인구 수 |
| `MAG_30_REPOP_CO` | 남성 30대 상주인구 수 |
| `MAG_40_REPOP_CO` | 남성 40대 상주인구 수 |
| `MAG_50_REPOP_CO` | 남성 50대 상주인구 수 |
| `MAG_60_ABOVE_REPOP_CO` | 남성 60대 이상 상주인구 수 |
| `FAG_10_REPOP_CO` | 여성 10대 상주인구 수 |
| `FAG_20_REPOP_CO` | 여성 20대 상주인구 수 |
| `FAG_30_REPOP_CO` | 여성 30대 상주인구 수 |
| `FAG_40_REPOP_CO` | 여성 40대 상주인구 수 |
| `FAG_50_REPOP_CO` | 여성 50대 상주인구 수 |
| `FAG_60_ABOVE_REPOP_CO` | 여성 60대 이상 상주인구 수 |
| `TOT_HSHLD_CO` | 총 가구 수 |
| `APT_HSHLD_CO` | 아파트 가구 수 |
| `NON_APT_HSHLD_CO` | 비아파트 가구 수 |

## 부동산원 통계표 목록

- ID: `reb_tables`
- 제공기관: 한국부동산원
- 원본: [공식 문서](https://www.reb.or.kr/r-one/portal/openapi/openApiDevPage.do)
- 서비스: `SttsApiTbl`
- 설명: 부동산원 제공 통계표 ID·이름·주기·수록기간·단위·주석 목록. 데이터 조회 전에 사용할 통계표를 찾습니다.
- 원본 요청 파라미터: `STATBL_ID, STATBL_NM`
- 기본값: `{}`

| 원본 필드 | 설명 |
| --- | --- |
| `STATBL_ID` | 통계표 ID |
| `STATBL_NM` | 통계표명 |
| `DTACYCLE_CD` | 수록주기 코드(YY/QQ/MM) |
| `DTACYCLE_NM` | 수록주기명 |
| `STAT_ID` | 통계 ID |
| `TOP_ORG_NM` | 제공기관명 |
| `OPEN_STATE` | 공개 여부 |
| `DATA_START_YY` | 자료 시작 연도 |
| `DATA_END_YY` | 자료 종료 연도 |
| `STATBL_IDTFR` | 통계표 식별자 |
| `STATBL_CMMT` | 통계표 주석 |
| `V_ORDER` | 표시 순서 |
| `RPSTUI_NM` | 대표 단위/기준시점 |

## 부동산원 통계표 항목

- ID: `reb_table_items`
- 제공기관: 한국부동산원
- 원본: [공식 문서](https://www.reb.or.kr/r-one/portal/openapi/openApiDevPage.do)
- 서비스: `SttsApiTblItm`
- 설명: 통계표의 지역/분류·항목 계층, 코드·이름·단위·주석. ITM_TAG를 구분해 CLS_ID·ITM_ID 등을 선택합니다.
- 원본 요청 파라미터: `STATBL_ID`
- 기본값: `{}`

| 원본 필드 | 설명 |
| --- | --- |
| `STATBL_ID` | 통계표 ID |
| `ITM_TAG` | 분류/항목 구분 |
| `ITM_ID` | 항목 ID |
| `PAR_ITM_ID` | 상위 항목 ID |
| `ITM_NM` | 항목명 |
| `ITM_FULLNM` | 전체 항목명 |
| `UI_NM` | 단위 |
| `ITM_CMMT_IDTFR` | 항목 주석 식별자 |
| `ITM_CMMT_CONT` | 항목 주석 |
| `V_ORDER` | 표시 순서 |
