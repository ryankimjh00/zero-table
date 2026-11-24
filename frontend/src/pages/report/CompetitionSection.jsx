import { DummyBadge, RealBadge } from '../../components/Badges.jsx'
import { count, won } from '../../format.js'

// 03 경쟁과 가격
export default function CompetitionSection({ sameIndustryStores, indicators, menuPrice }) {
  return (
    <section id="competition" className="report-section">
      <p className="eyebrow">03 / 경쟁과 가격</p>
      <h2 className="section-title">{won(menuPrice)}에 납득할 이유를 설계하세요</h2>
      <div className="two-col">
        <div className="panel">
          <h3>상권 경쟁 참고값 <RealBadge /></h3>
          <ul className="fact-list">
            <li><span>같은 업종 점포 수</span><strong>{count(sameIndustryStores, '곳')}</strong></li>
            <li><span>결제 1건당 금액</span><strong>{won(indicators?.averagePaymentAmount)}</strong></li>
            <li><span>점포당 월매출 참고값</span><strong>{won(indicators?.monthlySalesPerStore)}</strong></li>
          </ul>
        </div>
        <div className="panel">
          <h3>가격을 비교하는 기준 <DummyBadge>예시</DummyBadge></h3>
          <PriceBars price={menuPrice} />
          <p className="muted small">가상 메뉴 비교예요. 같은 메뉴의 주변 시세 자료가 없어 서버에서도 보류된 항목이에요.</p>
        </div>
      </div>
    </section>
  )
}

// 가격 비교 예시 막대 (더미 기준값)
function PriceBars({ price }) {
  const rows = [
    { name: '간편 식사형', value: 10000 },
    { name: '내 대표 메뉴', value: price, mine: true },
    { name: '프리미엄 세트형', value: 14000 },
  ]
  const max = Math.max(...rows.map((r) => r.value ?? 0), 1)
  return (
    <ul className="price-bars">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="row-between"><span className={r.mine ? 'accent' : ''}>{r.name}</span><span>{won(r.value)}</span></div>
          <div className="bar"><span className={r.mine ? '' : 'soft'} style={{ width: `${((r.value ?? 0) / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}
