# ZERO TABLE API

Java 17 · Spring Boot 3.5 · SQLite로 만든 공개 공공데이터 백엔드입니다.

- 운영: <https://webframework.monithub.org>
- Swagger: <https://webframework.monithub.org/swagger-ui.html>
- OpenAPI: <https://webframework.monithub.org/v3/api-docs>
- 데이터 사전: [docs/DATA-CATALOG.md](docs/DATA-CATALOG.md)
- 프론트 연결: [docs/FRONTEND.md](docs/FRONTEND.md)
- 창업 설문 점수 계산식·요청 예시: [docs/SCORING.md](docs/SCORING.md)

## 실행

JDK 17 이상, Python 3, curl이 필요합니다. Maven은 `mvnw`가 준비합니다. 아래 명령은 `backend` 디렉터리에서 실행하세요.

```bash
./scripts/run-local.sh
```

실행 후 [로컬 Swagger](http://localhost:8080/swagger-ui.html)에서 API를 확인할 수 있습니다. 데이터 수집이나 원본 프록시를 사용하려면 제공기관에서 발급받은 키를 `.local/api-config.json`에 저장하세요. `id`는 데이터 사전의 데이터셋 ID입니다.

```json
{
  "apis": [
    { "id": "seoul_estimated_sales", "api_key": "YOUR_SEOUL_API_KEY" }
  ]
}
```

```bash
# 별도 터미널: 초기 수집(소상공인 데이터는 3,000건으로 제한)
./scripts/collect-local.sh config/bootstrap-plan.json
# 서울 지역 전체 수집
./scripts/collect-local.sh config/collection-plan.json
# 데이터 사전 + 실행 중 서버의 Swagger 명세 내보내기
./scripts/export-docs.sh
```

## 데이터

| API | 주요 데이터 | 기본 수집 범위 |
| --- | --- | --- |
| 소상공인 상가정보 | 개별 점포 상호·주소·업종·위경도 | 서울(시도 코드 11) |
| 부동산원 통계 | 통계표·항목·시점·지역별 통계값 | 통계표 목록, 연간 지역별 지가지수 2025년 예시 |
| 서울 추정매출 | 금액·건수, 요일·시간·성별·연령 | 데이터가 있는 최신 분기 |
| 서울 길단위인구 | 상권별 총/성별/연령/요일/시간 인구 | 데이터가 있는 최신 분기 |
| 서울 점포 | 업종별 점포·개폐업·프랜차이즈 | 데이터가 있는 최신 분기 |
| 서울 상권영역 | 상권 코드·행정구역·면적·대표 좌표 | 전체 상권 |
| 서울 상주인구 | 성별·연령별 인구, 가구 | 원본이 제공하는 전체 분기 |
| 서울 직장인구 | 상권별 직장인구, 성별·연령별 집계 | 원본이 제공하는 전체 분기 |

서울 데이터는 **상권 단위**로 선택했습니다. `TRDAR_CD`, `STDR_YYQU_CD`, `SVC_INDUTY_CD`로 연결합니다. 개별 점포 주소와 서울시 상권은 코드 체계가 다르므로 바로 조인할 수 없습니다. 상권영역 API는 EPSG:5181 대표 좌표를 제공하며, 지도 경계 폴리곤은 제공하지 않습니다.

데이터 범위와 단위는 각 [공식 원본 링크를 포함한 데이터 사전](docs/DATA-CATALOG.md)을 확인하세요. 전체 통계표, 전국 점포, 모든 과거 분기를 자동 수집하는 설정은 아닙니다. 수집 범위는 `config/collection-plan.json`으로 확장할 수 있습니다.

## 주요 API

| 경로 | 용도 |
| --- | --- |
| `GET /api/v1/datasets` | 수집 가능한 데이터·필드·저장 건수 |
| `GET /api/v1/datasets/{dataset}` | 데이터셋 상세 |
| `GET /api/v1/datasets/{dataset}/records` | SQLite 데이터 조회·필터·페이징 |
| `GET /api/v1/proxy/{dataset}` | 허용된 원본 API를 공통 응답으로 프록시 |
| `GET /api/v1/collection-runs` | 수집 성공·실패·부분 수집 이력 |
| `GET /api/v1/assessments/rules` | 창업 설문의 100점 배점·계산 규칙 |
| `POST /api/v1/assessments` | 설문 답변과 저장 자료를 비교한 100점 환산 점수·평가 배점·보류 사유 |

인증·인가가 없고 모든 브라우저 origin에서 GET을 허용합니다. 제공기관 API 키는 서버의 별도 설정 파일에서 읽습니다. 프록시는 고정된 제공기관·서비스만 호출하고, 원본 파라미터를 허용 목록으로 제한합니다. 성공 응답은 10분 캐시하고 실제 외부 호출은 프로세스 전체 분당 60회로 제한합니다.

설문 계산 경로는 POST도 허용합니다. 규칙 `2026-11-24-v3`은 직장인·지역 주민의 상권 인구 밀도 적합도를 포함해 최대 61점분을 평가합니다. `scoreOutOf100`과 평가 배점 비율 `coveragePercent`를 함께 제공합니다. 전체 항목을 평가하면 `totalScore`도 반환합니다. 규칙은 `GET /api/v1/assessments/rules`에서 확인할 수 있습니다.

## 검증

```bash
./mvnw verify
API_BASE_URL=https://webframework.monithub.org python3 scripts/smoke-test.py
# 원본별 1건 실호출 검증(서버 API 키 사용, 9회 호출)
API_BASE_URL=https://webframework.monithub.org python3 scripts/verify-proxies.py
```

통합 테스트는 HTTP 모의 제공기관과 실제 SQLite를 사용해 페이지 수집, 중복 갱신, 실패 후 보존/재개, 부동산원·소상공인 응답 변환, 키 인코딩/비노출, 프록시 캐시, 파라미터 검증, CORS, Swagger, 일관된 백업을 확인합니다.

점수 계산은 별도 임시 SQLite의 가상 자료로 계산식, 분기·상권·업종 일치, 미정/0점 구분, 자료 누락, 전체 점포 수 적용, 입력 검증, POST CORS와 Swagger를 확인합니다.
