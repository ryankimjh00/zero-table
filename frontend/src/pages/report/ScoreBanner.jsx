import { RealBadge } from '../../components/Badges.jsx'

// 서버가 계산한 부분 점수를 그대로 보여 준다. totalScore는 전체 평가 전까지 null이다.
export default function ScoreBanner({ assessment }) {
  return (
    <section className="score-banner">
      <div>
        <p className="small">계산된 항목 점수 <RealBadge /></p>
        <p className="score-big">{assessment.earnedScore}<span> / {assessment.availablePoints}점</span></p>
      </div>
      <div>
        <h2>종합 점수는 {assessment.totalScore === null ? '보류' : `${assessment.totalScore}점`}예요.</h2>
        <p className="small">
          전체 100점 중 {assessment.coveragePercent}%만 계산할 수 있어요(규칙 {assessment.ruleVersion}).
          나머지는 답변이 미정이거나 서버에 비교 자료가 없어 보류됐어요.
        </p>
      </div>
    </section>
  )
}
