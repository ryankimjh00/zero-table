import { DummyBadge } from '../../components/Badges.jsx'
import { won } from '../../format.js'

// 04 비용과 자본
export default function CostSection({ startupCapital, monthlyCapital }) {
  return (
    <section id="cost" className="report-section">
      <p className="eyebrow">04 / 비용과 자본</p>
      <h2 className="section-title">좋은 자리보다 먼저, 버틸 수 있는 비용 구조인지 확인해요</h2>
      <div className="two-col">
        <div className="panel">
          <div className="row-between"><h3>초기 자본금 {won(startupCapital)}</h3><DummyBadge>배분 예시</DummyBadge></div>
          <ul className="fact-list">
            {[['보증금', 0.4], ['인테리어·시설', 0.3], ['주방·포장 장비', 0.16], ['예비 자금', 0.14]].map(([name, ratio]) => (
              <li key={name}><span>{name}</span><strong>{startupCapital ? won(startupCapital * ratio) : '-'} · {ratio * 100}%</strong></li>
            ))}
          </ul>
        </div>
        <div className="panel warn">
          <p className="small">먼저 확인할 항목</p>
          <h3>월 {won(monthlyCapital)}은 임대료만을 위한 예산이 아니에요.</h3>
          <p className="small">임대료·관리비·인건비·재료비·포장재 등 전체 운영 자금입니다. 실제 임대료가 아직 입력되지 않아 운영 가능 여부는 판단할 수 없어요.</p>
        </div>
      </div>
    </section>
  )
}
