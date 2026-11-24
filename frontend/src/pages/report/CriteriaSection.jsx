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

// 05 항목별 평가, 영업 시간 대안, 자료 출처
export default function CriteriaSection({ assessment }) {
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
      <p className="muted small">
        출처: {assessment.sources?.map((s) => `${s.dataset}(${s.matchingRecords}건)`).join(', ')}
      </p>
    </section>
  )
}
