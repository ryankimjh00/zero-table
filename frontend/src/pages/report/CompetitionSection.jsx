import { RealBadge } from '../../components/Badges.jsx'
import { count, won } from '../../format.js'

const PRICE_NOTICE =
  '같은 메뉴의 주변 시세 자료가 없어 가격을 비교하지 않았어요. 근처 가게의 비슷한 메뉴 가격과 구성을 직접 둘러보거나 배달 앱에서 확인해 보세요.'

// 03 경쟁과 가격
export default function CompetitionSection({ sameIndustryStores, indicators, menuPrice }) {
  const displayPrice = won(menuPrice, '미입력')

  return (
    <section id="competition" className="report-section">
      <p className="eyebrow">03 / 경쟁과 가격</p>
      <h2 className="section-title">
        {menuPrice ? `${displayPrice}에 납득할 이유를 설계하세요` : '대표 메뉴 가격에 납득할 이유를 설계하세요'}
      </h2>
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
          <h3>내 대표 메뉴 가격</h3>
          <p className="stat">{displayPrice}</p>
          <p className="muted small">{PRICE_NOTICE}</p>
        </div>
      </div>
    </section>
  )
}
