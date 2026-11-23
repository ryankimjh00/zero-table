import { Link } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import { INDUSTRIES } from '../constants/industries.js'

// "수제버거 · 서울 성수동 · 포장 | 기본 정보 수정" 줄
export default function SummaryBar({ editTo = '/input?mode=detail' }) {
  const { base } = useAnswers()
  const industry = INDUSTRIES.find((i) => i.code === base.industryCode)

  return (
    <div className="summary-bar">
      <span className="summary-icon" aria-hidden="true">🍴</span>
      <strong>{base.food || industry?.name}</strong>
      <span>{base.district ? `${base.district.gu} ${base.district.name}` : '동네 미정'}</span>
      <span className="tag">{base.salesMode}</span>
      <span className="summary-code">{industry?.name} · 상권 {base.district?.code}</span>
      <Link to={editTo} className="summary-edit">기본 정보 수정 ↗</Link>
    </div>
  )
}
