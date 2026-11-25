import { RealBadge } from '../../components/Badges.jsx'
import { labelOf } from './reportLabels.js'

// 보류 사유 코드 → 화면 문구
const STATUS_LABEL = {
  SCORED: '계산됨',
  MISSING_ANSWER: '답변 미정',
  MISSING_DATA: '비교 자료 부족',
  UNSUPPORTED_DATA: '자료 미제공',
  PENDING_RULE: '기준 협의 중',
}

// 데이터셋 ID → 읽기 쉬운 이름 및 원본 페이지 URL
const DATASET_META = {
  seoul_estimated_sales: {
    name: '서울시 추정매출',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-15572/S/1/datasetView.do',
  },
  seoul_pedestrian_population: {
    name: '서울시 길단위인구',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-15568/S/1/datasetView.do',
  },
  seoul_stores: {
    name: '서울시 점포',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-15577/S/1/datasetView.do',
  },
  seoul_commercial_districts: {
    name: '서울시 상권영역',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-15560/S/1/datasetView.do',
  },
  seoul_resident_population: {
    name: '서울시 상주인구',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-15584/S/1/datasetView.do',
  },
  seoul_workplace_population: {
    name: '서울시 직장인구',
    sourceUrl: 'https://data.seoul.go.kr/dataList/OA-15569/A/1/datasetView.do',
  },
  small_business_stores: {
    name: '소상공인시장진흥공단 상가정보',
    sourceUrl: 'https://www.data.go.kr/data/15012005/openapi.do',
  },
  reb_real_estate_statistics: {
    name: '한국부동산원 부동산통계',
    sourceUrl: 'https://www.reb.or.kr/r-one/portal/openapi/openApiDevPage.do',
  },
  reb_tables: {
    name: '부동산원 통계표 목록',
    sourceUrl: 'https://www.reb.or.kr/r-one/portal/openapi/openApiDevPage.do',
  },
  reb_table_items: {
    name: '부동산원 통계표 항목',
    sourceUrl: 'https://www.reb.or.kr/r-one/portal/openapi/openApiDevPage.do',
  },
}

// 분기 코드(예: '20262') → '2026년 2분기'
function formatQuarter(quarter) {
  const str = String(quarter ?? '')
  if (/^\d{5}$/.test(str)) return `${str.slice(0, 4)}년 ${str.slice(4)}분기`
  return str || null
}

// 수집 시각(ISO 문자열) → '수집 MM/DD'
function formatCollectedDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `수집 ${month}/${day}`
}

// 05 항목별 평가, 영업 시간 대안, 자료 출처
export default function CriteriaSection({ assessment, quarter }) {
  const sources = assessment.sources ?? []
  const quarterLabel = formatQuarter(quarter)

  return (
    <section id="criteria" className="report-section">
      <p className="eyebrow">05 / 항목별 평가 <RealBadge /></p>
      <h2 className="section-title">서버가 계산한 항목과 보류된 항목</h2>
      {assessment.categories.map((c) => (
        <div key={c.id} className="panel">
          <div className="row-between">
            <h3>{c.name}</h3>
            <strong>{c.score === null ? '보류' : `획득 ${c.score}점`} <span className="muted small">· 배점 {c.maxScore}점</span></strong>
          </div>
          <ul className="criteria-list">
            {c.criteria.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span className={`status ${item.status}`}>{STATUS_LABEL[item.status] ?? item.status}</span>
                <span className="criteria-value">
                  {item.score === null
                    ? `자료 없음 / 확인 필요${item.reason ? ` · ${item.reason}` : ''}`
                    : `획득 ${item.score}점 · 배점 ${item.maxScore}점`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {assessment.suggestions?.length > 0 && (
        <div className="panel">
          <h3>영업 시간 대안</h3>
          {assessment.suggestions.map((s) => (
            <p key={s.suggestedTime}>{labelOf('mainTime', s.currentTime)}({s.currentTimeScore}점) 대신 {labelOf('mainTime', s.suggestedTime)}({s.suggestedTimeScore}점)을 검토해보세요.</p>
          ))}
        </div>
      )}
      <p className="muted small">
        출처:{' '}
        {sources.length === 0 ? '자료 없음' : sources.map((s, index) => {
          const meta = DATASET_META[s.dataset]
          const name = s.datasetName ?? meta?.name ?? s.dataset
          const url = s.sourceUrl ?? meta?.sourceUrl
          const label = [name, quarterLabel, formatCollectedDate(s.collectedAt)].filter(Boolean).join(' · ')

          return (
            <span key={`${s.dataset}-${index}`}>
              {index > 0 && ', '}
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="text-link" style={{ textDecoration: 'underline' }}>
                  {label}
                </a>
              ) : label}
            </span>
          )
        })}
      </p>
    </section>
  )
}