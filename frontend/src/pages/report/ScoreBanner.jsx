// 보고서 상단의 종합 점수와 반영 근거, 보류 항목 요약을 보여 준다.
import { RealBadge } from '../../components/Badges.jsx'
import { assessmentScore } from '../../format.js'
import { criteriaOf } from './reportLabels.js'

export default function ScoreBanner({ assessment }) {
  const score = assessmentScore(assessment)
  const allCriteria = criteriaOf(assessment)
  const scoredCriteria = allCriteria.filter((item) => item.status === 'SCORED')
  const unconfirmedCriteria = allCriteria.filter((item) => item.score === null)

  return (
    <section className="score-banner">
      <div>
        <p className="small">종합 점수 <RealBadge /></p>
        {score === null ? <h2>산정 보류</h2> : <p className="score-big">{score}<span> / 100점</span></p>}
      </div>
      <div>
        <h2>평가 배점 {assessment.coveragePercent}%</h2>
        <p className="small">평가 가능한 항목의 결과를 100점으로 환산해요. 규칙 {assessment.ruleVersion}</p>
      </div>

      <div className="score-banner-details">
        <div className="score-basis-box">
          <h3>반영된 근거</h3>
          {scoredCriteria.length === 0 ? (
            <p className="muted small">점수에 반영된 항목이 없어요.</p>
          ) : (
            <ul className="score-basis-list">
              {scoredCriteria.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <strong className="score-basis-value">{item.score} / {item.maxScore}점</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="score-basis-box warn">
          <h3>아직 확인하지 못한 것</h3>
          {unconfirmedCriteria.length === 0 ? (
            <p className="muted small">모든 항목이 평가에 반영되었어요.</p>
          ) : (
            <ul className="score-basis-list">
              {unconfirmedCriteria.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span className="score-basis-value">{item.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}