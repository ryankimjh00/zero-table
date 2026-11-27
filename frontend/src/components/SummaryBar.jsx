// 선택한 업종·상권·판매 방식 요약과 기본 정보 수정 링크를 보여 준다.
import { Link } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import { INDUSTRIES } from '../constants/industries.js'

export default function SummaryBar({ editTo = '/input?mode=detail' }) {
  const { base } = useAnswers()
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