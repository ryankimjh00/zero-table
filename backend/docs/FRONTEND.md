# 프론트엔드 연결

기본 주소는 `https://webframework.monithub.org`입니다. 로그인·토큰 없이 호출하고 CORS는 모든 origin의 GET/OPTIONS를 허용합니다.

창업 설문 평가는 `POST /api/v1/assessments`에서 계산합니다. 이 경로에는 POST CORS도 허용합니다. 계산식·선택지·숫자 단위·보류 처리 기준은 [SCORING.md](SCORING.md)를 확인하세요. 새 평가 API의 운영 배포 여부는 Swagger에서 확인합니다.

```javascript
const response = await fetch(`${baseUrl}/api/v1/assessments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(answers),
});
const result = await response.json();
if (!response.ok) throw new Error(result.message);
// 화면 예: 60 / 100점 · 평가 배점 61%
const scoreLabel = result.scoreOutOf100 == null ? '산정 보류' : `${result.scoreOutOf100} / 100점`;
const coverageLabel = `평가 배점 ${result.coveragePercent}%`;
```

`customer.type`은 하나의 값을 받습니다. `WORKER`와 `RESIDENT`는 같은 분기·상권 유형의 인구 밀도로 평가합니다. `schedule.canAdjustHours`, `demand.monthlyOperatingDays`, `demand.expectedDailyTeams`는 선택 입력입니다. `suggestions`가 있으면 추천 시간대와 비교 점수를 표시합니다. 영역과 세부 항목은 응답의 `categories`를 사용하고, `score=null` 항목에는 `reason`을 표시하세요.

## 저장 데이터 조회

```javascript
const baseUrl = 'https://webframework.monithub.org';
const params = new URLSearchParams({ page: '1', size: '100', quarter: '20262' });
const response = await fetch(`${baseUrl}/api/v1/datasets/seoul_estimated_sales/records?${params}`);
if (!response.ok) throw new Error((await response.json()).message);
const { items, total, hasNext } = await response.json();
```

```json
{
  "dataset": "seoul_estimated_sales",
  "page": 1,
  "size": 100,
  "total": 21133,
  "hasNext": true,
  "source": "sqlite",
  "fetchedAt": "2026-10-31T07:00:00Z",
  "items": [
    {
      "STDR_YYQU_CD": "20262",
      "TRDAR_CD": "3130167",
      "TRDAR_CD_NM": "연신내상점가(연빛거리)",
      "SVC_INDUTY_CD": "CS300011",
      "SVC_INDUTY_CD_NM": "일반의류",
      "THSMON_SELNG_AMT": 796270824.0
    }
  ]
}
```

위 응답은 원본 실측값을 바탕으로 축약한 형식 예시입니다. `items`에는 해당 API의 모든 원본 필드가 들어갑니다. `source=upstream`의 `fetchedAt`은 원본을 호출한 시간, `source=sqlite`에서는 조회 범위의 마지막 수집 시간입니다. 캐시된 프록시 응답은 원본 호출 시각을 유지합니다. SQLite 조회 결과가 없으면 `fetchedAt=null`입니다.

- `page`: 1부터, 최대 100000
- `size`: 1~1000, 기본 100
- `quarter`: 서울 분기 코드, 예: `20262`
- `districtCode`: 서울 상권 코드 `TRDAR_CD`
- `industryCode`: 서울 업종 `SVC_INDUTY_CD`, 소상공인 업종 `indsSclsCd`
- `regionCode`: 원본에 자치구 코드가 있는 상권영역/개별 점포의 `SIGNGU_CD`/`signguCd`
- `tableId`: 부동산원 통계표 `STATBL_ID`

서울 추정매출·인구·점포 자료에는 자치구 코드가 직접 없으므로 자치구 필터는 상권영역의 `SIGNGU_CD`에서 상권 코드를 구한 뒤 `districtCode`로 조회합니다. 데이터셋별 최신 수집 분기가 다를 수 있으므로 비교할 때는 동일 분기를 지정하세요.

## 원본 프록시

```text
GET /api/v1/proxy/seoul_estimated_sales?page=1&size=100&quarter=20262
GET /api/v1/proxy/seoul_commercial_districts?page=1&size=1000
GET /api/v1/proxy/small_business_stores?divId=signguCd&key=11680&page=1&size=100
GET /api/v1/proxy/reb_tables?page=1&size=100
GET /api/v1/proxy/reb_table_items?STATBL_ID=A_2024_00900
GET /api/v1/proxy/reb_real_estate_statistics?STATBL_ID=A_2024_00900&DTACYCLE_CD=YY&WRTTIME_IDTFR_ID=2025
```

상주인구 원본 프록시는 `quarter`를 지원하지 않습니다. 전체 분기를 수집한 SQLite `/records?quarter=20262`에서 필터하세요.

프록시를 호출해도 SQLite에 저장되지는 않습니다. 저장 데이터는 수집 CLI 또는 정기 수집으로 갱신합니다. `quarter=latest`는 수집 계획에서만 사용하며, 공개 프록시는 `20262`처럼 명시적인 분기를 받습니다. 프록시에서 `key`는 소상공인 **지역 코드**이며 제공기관 인증키는 서버가 주입합니다. 원본 사이트, 서비스명, 인증키를 요청으로 변경할 수 없습니다.

## 데이터 연결과 해석

- 상권영역 ↔ 인구·매출·점포: `TRDAR_CD`
- 서로 다른 분기 집계: `TRDAR_CD + STDR_YYQU_CD`
- 매출 ↔ 점포: `TRDAR_CD + STDR_YYQU_CD + SVC_INDUTY_CD`
- 서울시 상권영역 좌표: EPSG:5181. 지도 SDK의 위경도에는 좌표 변환이 필요합니다. 이 API는 경계 도형을 반환하지 않습니다.
- 소상공인 `lon`/`lat`: 경도·위도. 서울시 업종 코드와 소상공인 업종 코드는 별개입니다.
- 부동산원 수치는 통계표의 주기·단위·기준시점·주석을 확인하세요. 통계표를 임의로 합산하지 않습니다.
- 매출은 추정치이며 개인 성별/연령 합계와 법인 포함 총액이 다를 수 있습니다. 실제 월별 매출로 바꾸어 해석하지 않습니다.
- 상주인구는 공식 안내상 연 1회 갱신한 값을 이후 분기에 재사용할 수 있습니다.
- 재수집은 자연키 기준 갱신합니다. 원본에서 사라진 레코드의 삭제 동기화는 수행하지 않으므로 완전한 최신 스냅샷이 아닌 수집 저장소입니다.

화면에는 제공기관 출처를 표시하고 원본 데이터셋 링크를 연결하세요. 필드 설명과 출처는 `/api/v1/datasets/{dataset}`에서 얻을 수 있습니다.

## 오류

```json
{"code":"UPSTREAM_KEY_INVALID","message":"제공기관 API 오류입니다. 인증키·요청 조건·할당량을 확인하세요.","timestamp":"2026-10-31T07:00:00Z"}
```

| HTTP | 대표 코드 | 처리 |
| --- | --- | --- |
| 400 | INVALID_REQUEST / INVALID_PARAMETER | 값·필드·분기 형식 확인 |
| 404 | DATASET_NOT_FOUND | 데이터셋 ID 확인 |
| 429 | UPSTREAM_RATE_LIMIT | `Retry-After: 60`에 따라 재시도 |
| 502 | UPSTREAM_KEY_INVALID / UPSTREAM_UNAVAILABLE | 원본 장애·키 상태 확인, 저장 데이터 이용 |
| 503 | API_KEY_MISSING | 운영자 설정 필요 |

결과 없음은 정상 HTTP 200, `total=0`, `items=[]`입니다. 미수집과 실제 빈 원본은 `/collection-runs`와 함께 판단합니다.
