// 보고서 03 경쟁과 가격: 상권 경쟁 참고값, 대표 메뉴 가격, 판매 방식별 운영 점검.
import { RealBadge } from '../../components/Badges.jsx'
import FactsRetryNotice from '../../components/FactsRetryNotice.jsx'
import { isFactFailed } from '../../api.js'
import { count, FAILED_TEXT, percent, won } from '../../format.js'

const PRICE_NOTICE =
  '같은 메뉴의 주변 시세 자료가 없어 가격을 비교하지 않았어요. 근처 가게의 비슷한 메뉴 가격과 구성을 직접 둘러보거나 배달 앱에서 확인해 보세요.'

// 판매 방식별 운영 점검 문구. 상권 데이터 분석이 아니라 미리 정한 안내다.
const SALES_MODE_CHECKS = {
  '매장 식사': '테이블 수와 예상 회전수를 바탕으로 홀에서 목표 주문을 처리할 수 있는지 확인해 보세요. 손님이 편하게 이용할 수 있는 좌석 배치와 대기 공간도 살펴보세요.',
  포장: '고객이 매장을 쉽게 찾고 주문한 음식을 편하게 받아갈 수 있는지 확인해 보세요. 포장 대기 공간과 음식의 온도·형태가 유지되는지도 점검해 보세요.',
  배달: '배달 가능 지역의 경쟁 매장과 배달 수요를 살펴보세요. 배달 수수료·포장비와 이동 중 음식의 품질 유지도 함께 확인해 보세요.',
}

export default function CompetitionSection({
  facts,
  onRetryFacts,
  indicators,
  menuPrice,
  salesModes = [],
}) {
  const displayPrice = won(menuPrice, '미입력')
  const checkedModes = salesModes.filter((mode) => SALES_MODE_CHECKS[mode])
  // 점포 자료를 불러오지 못했으면 점포 칸 네 개에 '불러오지 못함'을 쓴다
  const storesFailed = isFactFailed(facts, 'stores')
  const storeValue = (text) => (storesFailed ? FAILED_TEXT : text)

  return (
    <section id="competition" className="report-section">
      <p className="eyebrow">03 / 경쟁과 가격</p>
      <h2 className="section-title">
        {menuPrice ? `${displayPrice}에 납득할 이유를 설계하세요` : '대표 메뉴 가격에 납득할 이유를 설계하세요'}
      </h2>
      <FactsRetryNotice facts={facts} usedSources={['stores']} onRetry={onRetryFacts} />
      <div className="two-col">
        <div className="panel">
          <h3>상권 경쟁 참고값 <RealBadge /></h3>
          <ul className="fact-list">
            <li><span>같은 업종 점포 수</span><strong>{storeValue(count(facts.sameIndustryStores, '곳'))}</strong></li>
            <li><span>프랜차이즈 점포 수</span><strong>{storeValue(count(facts.franchiseStores, '곳'))}</strong></li>
            <li><span>개업률</span><strong>{storeValue(percent(facts.openRate))}</strong></li>
            <li><span>폐업률</span><strong>{storeValue(percent(facts.closeRate))}</strong></li>
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

      {checkedModes.length > 0 && (
        <div className="panel">
          <h3>판매 방식 운영 점검</h3>
          <ul className="sales-check-list">
            {checkedModes.map((mode) => (
              <li key={mode}>
                <span className="tag">{mode}</span>
                <p>{SALES_MODE_CHECKS[mode]}</p>
              </li>
            ))}
          </ul>
          <p className="muted small">상권 데이터 분석 결과가 아니라, 고른 판매 방식에 맞춰 미리 점검하면 좋은 운영 안내예요.</p>
        </div>
      )}
    </section>
  )
}
