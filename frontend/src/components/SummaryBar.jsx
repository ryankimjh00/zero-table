import { Link } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import { INDUSTRIES } from '../constants/industries.js'

// "수제버거 · 서울 성수동 · 포장 | 기본 정보 수정" 줄
// 결과 화면은 분석할 때 입력(analyzedBase)을 넘기고, 입력 화면은 넘기지 않아 지금 입력을 보여 준다.
export default function SummaryBar({ analyzedBase, editTo = '/input?mode=detail' }) {
  const { base: currentBase } = useAnswers()
  const base = analyzedBase ?? currentBase
  const industry = INDUSTRIES.find((i) => i.code === base.industryCode)

  return (
    <div className="summary-bar">
      <span className="summary-icon" aria-hidden="true">🍴</span>
      <strong>{base.food || industry?.name}</strong>
      <span>{base.district ? `${base.district.gu} ${base.district.name}` : '동네 미정'}</span>
      <span className="tag">{base.salesModes.length > 0 ? base.salesModes.join(' · ') : '판매 방식 미정'}</span>
      <span className="summary-code">{industry?.name} · 상권 {base.district?.code}</span>
      <Link to={editTo} className="summary-edit">기본 정보 수정 ↗</Link>
    </div>
  )
}
