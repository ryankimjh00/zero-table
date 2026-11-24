import { RealBadge } from '../../components/Badges.jsx'
import { assessmentScore } from '../../format.js'

export default function ScoreBanner({ assessment }) {
  const score = assessmentScore(assessment)

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
    </section>
  )
}
