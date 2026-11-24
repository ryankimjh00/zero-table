import { RealBadge } from '../../components/Badges.jsx'
import { count, won } from '../../format.js'
import { labelOf } from './reportLabels.js'

// 한 달 영업일 가정. 시안 계산식(하루 필요 주문 수)에 쓰며, 질문으로 받지 않아 고정한다.
const ASSUMED_OPERATING_DAYS = 22

// 02 고객과 수요
export default function DemandSection({ facts, mainTime, targetMonthlySales, menuPrice }) {
  const mainTimeLabel = labelOf('mainTime', mainTime)
  const monthlyOrders = targetMonthlySales && menuPrice ? targetMonthlySales / menuPrice : null
  const dailyOrders = monthlyOrders ? monthlyOrders / ASSUMED_OPERATING_DAYS : null

  return (
    <section id="demand" className="report-section">
      <p className="eyebrow">02 / 고객과 수요</p>
      <h2 className="section-title">{mainTimeLabel} 시간대를 중심으로 살펴봐요</h2>
      <div className="two-col">
        <div className="panel">
          <div className="row-between"><h3>시간대별 매출 지수</h3><RealBadge /></div>
          <TimeChart slots={facts.timeSlots} selected={mainTimeLabel} />
          <p className="muted small">추정매출을 시간당 매출로 바꿔 가장 높은 시간대를 100으로 맞춘 값이에요.</p>
        </div>
        <div className="panel">
          <h3>상권 수요 참고값 <RealBadge /></h3>
          <ul className="fact-list">
            <li><span>분기 유동인구</span><strong>{count(facts.pedestrians, '명')}</strong></li>
            <li><span>상주인구</span><strong>{count(facts.residents, '명')}</strong></li>
            <li><span>분기 업종 추정매출</span><strong>{won(facts.quarterSales)}</strong></li>
          </ul>
        </div>
      </div>
      <div className="three-col">
        <div className="panel"><p className="muted small">입력한 월 매출 목표</p><p className="stat">{won(targetMonthlySales)}</p></div>
        <div className="panel"><p className="muted small">필요한 월 주문 수</p><p className="stat">{monthlyOrders ? `약 ${Math.round(monthlyOrders).toLocaleString()}건` : '계산 불가'}</p>
          <p className="muted small">목표 ÷ 메뉴 가격 (1주문 1메뉴 가정)</p></div>
        <div className="panel"><p className="muted small">하루 필요한 주문 수</p><p className="stat">{dailyOrders ? `약 ${Math.round(dailyOrders)}건` : '계산 불가'}</p>
          <p className="muted small">월 {ASSUMED_OPERATING_DAYS}일 영업 가정</p></div>
      </div>
    </section>
  )
}

// 시간대 막대 차트. 사용자가 고른 시간대만 진하게 칠한다.
function TimeChart({ slots, selected }) {
  if (!slots) return <p className="muted">이 상권·업종의 시간대 매출 자료가 없어요.</p>
  return (
    <div className="time-chart">
      {slots.map((s) => (
        <div key={s.label} className="time-bar">
          <span className="time-value">{s.index}</span>
          <div className="time-track">
            <div className={s.label === selected ? 'time-fill selected' : 'time-fill'} style={{ height: `${s.index}%` }} />
          </div>
          <span className="time-label">{s.label}</span>
        </div>
      ))}
    </div>
  )
}
