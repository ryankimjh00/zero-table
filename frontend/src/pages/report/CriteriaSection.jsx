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

// 데이터셋 ID → 화면 이름. 원본 주소는 서버 응답의 sourceUrl을 쓴다.
const DATASET_NAMES = {
  seoul_estimated_sales: '서울시 추정매출',
  seoul_stores: '서울시 점포',
  seoul_pedestrian_population: '서울시 길단위인구',
  seoul_resident_population: '서울시 상주인구',
  seoul_workplace_population: '서울시 직장인구',
  seoul_commercial_districts: '서울시 상권영역',
}

// 분기 코드(예: '20262') → '2026년 2분기'
function formatQuarter(quarter) {
  const code = String(quarter ?? '')
  return /^\d{5}$/.test(code) ? `${code.slice(0, 4)}년 ${code.slice(4)}분기` : null
}

// 자료마다 수집 시각이 조금씩 달라서, 가장 최근 날짜 하나만 'MM/DD'로 보여 준다
function latestCollectedDate(sources) {
  const times = sources.map((s) => new Date(s.collectedAt).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null
  const date = new Date(Math.max(...times))
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

// 05 항목별 평가, 영업 시간 대안, 자료 출처
export default function CriteriaSection({ assessment, quarter }) {
  const sources = assessment.sources ?? []
  const quarterLabel = formatQuarter(quarter)
  const collectedDate = latestCollectedDate(sources)
  const sourceSummary = [
    '자료 출처',
    quarterLabel && `${quarterLabel} 기준`,
    collectedDate && `${collectedDate} 수집`,
  ].filter(Boolean).join(' · ')

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
                  {item.score === null ? item.reason : `획득 ${item.score}점 · 배점 ${item.maxScore}점`}
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
      {sources.length > 0 && (
        <div className="source-block">
          <p className="muted small">{sourceSummary}</p>
          <ul className="source-tags">
            {sources.map((s) => {
              const name = DATASET_NAMES[s.dataset] ?? s.dataset
              return (
                <li key={s.dataset}>
                  {s.sourceUrl
                    ? <a href={s.sourceUrl} target="_blank" rel="noreferrer">{name} ↗</a>
                    : <span>{name}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}