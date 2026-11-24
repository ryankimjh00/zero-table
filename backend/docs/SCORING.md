# 창업 설문 점수 계산

`POST /api/v1/assessments`로 평가하고 `GET /api/v1/assessments/rules`로 세부 배점을 조회합니다. 현재 규칙은 `2026-11-24-v3`입니다. 직장인·지역 주민은 전체 배점 100점 중 최대 61점분을 평가합니다.

## 100점 배점

| 영역 | 항목 | 배점 | 자료 및 초안 산식 |
| --- | --- | ---: | --- |
| 목표 고객 적합도 | 연령대 | 10 | 선택 연령 매출 ÷ 매출이 가장 큰 연령군 × 10 |
| | 고객 유형 | 5 | 동일 분기·상권 유형의 인구 밀도 백분위 × 5. 직장인은 직장인구, 지역 주민은 상주인구를 사용. 학생·관광객은 보류 |
| | 이용 상황 | 5 | 보류. 유동인구는 통행 규모 참고값이며 방문 목적별 구매 자료가 필요 |
| 판매 시간 적합도 | 영업 요일 | 10 | 계획 요일군 일평균 매출 ÷ 일평균이 가장 높은 요일군 × 10. 평일·주말 모두 영업은 유효한 매출 자료가 있으면 10점 |
| | 판매 시간대 | 10 | 선택 시간대 시간당 매출 ÷ 시간당 매출이 가장 높은 시간대 × 10 |
| 업종 수요 수준 | 추정매출 | 10 | 같은 분기·상권 유형·업종의 분기 추정매출 백분위 × 10 |
| | 잠재 수요 | 10 | 같은 분기·상권 유형의 유동인구 백분위 × 5 + 상주인구 백분위 × 5 |
| 경쟁 전략·점포 조건 | 동종업종 경쟁 | 8 | 전체 점포 수와 같은 분기·상권 유형·업종의 백분위를 반환. 점포 수가 수요와 경쟁을 함께 반영하므로 점수 방향·구간은 협의 필요 |
| | 대표 메뉴 가격 | 6 | 보류. 같은 메뉴·규격의 주변 시세 필요 |
| | 매장 수용 계획 | 6 | `6 × min(1, 테이블 수 × 하루 회전 수 ÷ 하루 예상 방문 팀 수)` |
| | 초기 자본 | 5 | 보류. 후보 점포의 보증금·권리금·시설비 필요 |
| | 월 가용자금 | 5 | 보류. 후보 점포의 임대료·인건비·원가 필요 |
| 운영 준비도 | 근무·운영 경험 | 5 | 보류. 관련 경험과 교육·동업 등 보완 계획의 반영 기준 협의 필요 |
| | 직접 운영 참여 | 5 | 보류. 실제 영업 일정과 대체 인력의 반영 기준 협의 필요 |

- **백분위:** `(대상보다 값이 낮은 비교 상권 수 + 같은 값의 상권 수 × 0.5) ÷ 유효 비교 상권 수`. 대상 상권을 제외한 최소 5곳을 사용합니다. 매출·점포는 업종도 동일해야 합니다. 잠재 수요는 유동인구·상주인구 비교군을 따로 사용하고 두 지표를 각각 5점으로 계산합니다. 응답의 백분위는 0~100, 산식의 백분위는 0~1입니다.
- **고객 유형:** 인구 수를 상권영역의 면적으로 나눠 ㎢당 인구를 계산합니다. 같은 분기에서 인구 자료와 상권영역의 유형 코드가 일치하는 상권끼리 비교합니다. 면적이 0이거나 유효 비교 상권이 5곳 미만이면 평가를 보류합니다.
- **기간과 단위:** 평일·주말 일수는 실제 분기 달력 기준입니다. 시간대는 오전 06~11, 점심 11~14, 오후 14~17, 저녁 17~21, 심야 21~06시입니다. 심야는 21~24시와 00~06시를 합칩니다. 연령 50대 이상은 50대와 60대 이상을 합칩니다.
- **월매출 계획:** `monthlySalesPerStore = 분기 업종 추정매출 ÷ 3 ÷ 전체 점포 수`를 목표 월매출과 화면에서 함께 볼 수 있습니다. 점포 수에는 프랜차이즈와 분기 중 일부 폐업 점포가 포함될 수 있습니다. `targetDailySales = 목표 월매출 ÷ 월 영업일 수`, `targetSalesPerTeam = 목표 일매출 ÷ 하루 예상 방문 팀 수`도 표시할 수 있습니다. 이 지표들은 업종 수요 점수에 반영하지 않습니다.
- **수용 계획:** 한 팀이 테이블 하나를 쓴다는 가정입니다. 5개 테이블을 하루 3회씩 쓰고 18팀이 올 계획이면 15팀분으로 계산해 5/6점입니다. 면적·좌석 수는 입력으로 받으며 실제 배치와 피크 시간 수용량은 별도 확인이 필요합니다.
- **가격·비용 비교:** `averagePaymentAmount`는 결제 1건당 참고액입니다. 후보 점포 초기·월 비용과 동일 메뉴 가격을 비교하려면 각각 실제 견적이나 시세 자료가 필요합니다.

## 확인한 데이터

운영 API에서 2026년 2분기 GS강동자이아파트 상권(`3111083`)의 커피·음료업(`CS100010`)을 조회했습니다. 연령·요일·시간대별 매출 필드와 업종 추정매출 429,535,686원, 동종 전체 점포 4곳, 유동인구 집계값 1,127,312, 상주인구 3,031명을 확인했습니다.

아래 요청 예시에서 더 높은 점수가 나오는 시간대는 `suggestions`에서 확인합니다. 기존 평가 56점분에 고객 유형 배점 5점이 추가됩니다.

| 운영 데이터셋 | 사용하는 필드 |
| --- | --- |
| `seoul_estimated_sales` | `THSMON_SELNG_AMT`, `AGRDE_*`, `MDWK_SELNG_AMT`, `WKEND_SELNG_AMT`, `TMZON_*` |
| `seoul_pedestrian_population` | `TOT_FLPOP_CO` |
| `seoul_resident_population` | `TOT_REPOP_CO` |
| `seoul_workplace_population` | `TOT_WRC_POPLTN_CO` |
| `seoul_commercial_districts` | `RELM_AR` |
| `seoul_stores` | `SIMILR_INDUTY_STOR_CO` |
| 공통 | 비교군 구분에 `TRDAR_SE_CD` 사용 |

- [서울시 추정매출](https://data.seoul.go.kr/dataList/OA-15572/S/1/datasetView.do)
- [서울시 길단위인구](https://data.seoul.go.kr/dataList/OA-15568/S/1/datasetView.do)
- [서울시 상주인구](https://data.seoul.go.kr/dataList/OA-15584/S/1/datasetView.do)
- [서울시 직장인구](https://data.seoul.go.kr/dataList/OA-15569/A/1/datasetView.do)
- [서울시 상권영역](https://data.seoul.go.kr/dataList/OA-15560/S/1/datasetView.do)
- [서울시 점포](https://data.seoul.go.kr/dataList/OA-15577/S/1/datasetView.do?tab=A)

## 요청과 응답

```json
{
  "quarter": "20262",
  "districtCode": "3111083",
  "industryCode": "CS100010",
  "customer": { "type": "WORKER", "ageGroup": "TWENTIES", "visitPurpose": "WORK_SCHOOL" },
  "schedule": { "businessDays": "WEEKDAYS", "mainTime": "DINNER", "canAdjustHours": true },
  "demand": { "targetMonthlySales": 20000000, "monthlyOperatingDays": 24, "expectedDailyTeams": 18 },
  "strategy": {
    "menuPrice": 12000,
    "areaPyeong": 10,
    "seatCount": 15,
    "tableCount": 5,
    "dailyTurns": 3,
    "startupCapital": 50000000,
    "monthlyCapital": 3000000
  },
  "readiness": { "experience": "EMPLOYEE", "participation": "FULL_TIME" }
}
```

`quarter`, `districtCode`, `industryCode`가 필수입니다. 선택형의 미정은 `UNDECIDED` 또는 `null`입니다. 영업시간 조정은 `true` 가능, `false` 불가, `null` 미정으로 받습니다. 조정 가능으로 답했고 더 높은 점수의 시간대가 있으면 `suggestions`에 대안 시간대와 비교 점수를 제공합니다. 대안은 현재 점수에 가산하지 않습니다.

금액은 원 단위 정수, 면적은 평 단위 숫자, 테이블 회전은 하루 회전 수입니다. `monthlyOperatingDays`는 1~31일, `expectedDailyTeams`는 1~100,000팀의 정수입니다. 미정은 `null` 또는 생략으로 보냅니다.

| 선택형 필드 | 선택지 |
| --- | --- |
| `customer.type` | `WORKER` 직장인 / `STUDENT` 학생 / `RESIDENT` 지역 주민 / `TOURIST` 관광객 |
| `customer.ageGroup` | `TEENS` 10대 / `TWENTIES` 20대 / `THIRTIES` 30대 / `FORTIES` 40대 / `FIFTY_PLUS` 50대 이상 |
| `customer.visitPurpose` | `PASSING_BY` 지나가다 구매 / `WORK_SCHOOL` 직장·학교 근처 / `REGULAR_LOCAL` 동네 단골 / `DESTINATION` 목적 방문 |
| `schedule.businessDays` | `WEEKDAYS` 평일 / `WEEKENDS` 주말 / `ALL` 모두 |
| `schedule.mainTime` | `MORNING` 오전 / `LUNCH` 점심 / `AFTERNOON` 오후 / `DINNER` 저녁 / `LATE_NIGHT` 심야 |
| `readiness.experience` | `NONE` 경험 없음 / `EMPLOYEE` 직원 / `MANAGER` 관리 / `OWNER` 운영 |
| `readiness.participation` | `FULL_TIME` 전업 / `THREE_FOUR_DAYS` 주 3~4일 / `WEEKENDS` 주말 |

- 종합 화면에는 `scoreOutOf100 = 100 × earnedScore ÷ availablePoints`와 `coveragePercent`를 함께 표시합니다. 예를 들어 획득 36.60점, 평가 배점 61점이면 **60/100점 · 평가 배점 61%**입니다. 평가 배점이 0이면 환산 점수가 `null`입니다. 모든 항목이 평가되면 `totalScore`도 반환합니다.
- 항목의 `score`가 `null`이면 보류 사유를 표시합니다. `MISSING_ANSWER`는 미정, `MISSING_DATA`는 유효한 비교 자료 부족, `UNSUPPORTED_DATA`는 비교에 필요한 자료 미제공, `PENDING_RULE`은 기준 협의가 필요한 항목입니다.
- `criteria[].evidence`는 계산 및 비교 근거, `indicators`는 참고값, `sources`는 조회에 사용한 데이터셋과 대상 자료 수집 시각입니다.
- 이전 응답의 `monthly-target`은 `industry-sales`와 `potential-demand`로 교체했습니다. `store-size`, `table-count`, `table-turns`는 `capacity`로 통합했습니다. 화면은 `ruleVersion`을 함께 보관해 이전 점수와 구분하세요.
