import { RealBadge } from '../../components/Badges.jsx'
import { count, won } from '../../format.js'
import { labelOf } from './reportLabels.js'

// 한 달 영업일 기본 가정값. 입력값이 없을 때 사용한다.
const DEFAULT_OPERATING_DAYS = 22

// 02 고객과 수요
export default function DemandSection({
  facts,
  mainTime,
  ageGroup,
  businessDays,
  monthlyOperatingDays,
  targetMonthlySales,
  menuPrice,
}) {
  const mainTimeLabel = labelOf('mainTime', mainTime)

  // 영업일 수: 입력값이 있으면 사용하고 없으면 기본 22일 가정
  const operatingDays = monthlyOperatingDays || DEFAULT_OPERATING_DAYS
  const operatingDaysLabel = monthlyOperatingDays
    ? `월 ${monthlyOperatingDays}일 영업`
    : `월 ${DEFAULT_OPERATING_DAYS}일 영업 가정`

  // 목표 매출 또는 메뉴 가격이 입력되지 않았으면 주문 수 계산 불가 -> '미입력' 표시
  const hasSalesAndPrice = Boolean(targetMonthlySales && menuPrice)
  const monthlyOrders = hasSalesAndPrice ? targetMonthlySales / menuPrice : null
  const dailyOrders = monthlyOrders ? monthlyOrders / operatingDays : null

  // 영업 요일 선택에 따른 요일 강조 여부 판정
  const isDaySelected = (slot) => {
    if (!businessDays || businessDays === 'UNDECIDED') return false
    if (businessDays === 'ALL') return true
    if (businessDays === 'WEEKDAYS') return !slot.isWeekend
    if (businessDays === 'WEEKENDS') return slot.isWeekend
    return false
  }

  return (
    <section id="demand" className="report-section">
      <p className="eyebrow">02 / 고객과 수요</p>
      <h2 className="section-title">{mainTimeLabel} 시간대를 중심으로 살펴봐요</h2>

      {/* 상권 수요 참고값: 3개의 독립된 미니 카드로 분리하여 명확한 구분 제공 */}
      <div className="panel demand-facts-panel">
        <div className="row-between" style={{ marginBottom: '14px' }}>
          <h3>상권 수요 참고값</h3>
          <RealBadge />
        </div>
        <div className="three-col demand-fact-cards">
          <div className="demand-fact-card">
            <span className="muted small">분기 유동인구</span>
            <strong className="demand-fact-value">{count(facts.pedestrians, '명')}</strong>
          </div>
          <div className="demand-fact-card">
            <span className="muted small">상주인구</span>
            <strong className="demand-fact-value">{count(facts.residents, '명')}</strong>
          </div>
          <div className="demand-fact-card">
            <span className="muted small">분기 업종 추정매출</span>
            <strong className="demand-fact-value">{won(facts.quarterSales)}</strong>
          </div>
        </div>
      </div>

      {/* 3대 차트 대시보드: 화면이 줄어들면 깨지지 않고 자연스럽게 1~2열로 감싸지도록 minmax 설정 */}
      <div className="charts-grid">
        <div className="panel">
          <div className="row-between"><h3>시간대별 매출 지수</h3><RealBadge /></div>
          <BarChart
            slots={facts.timeSlots}
            isSelected={(slot) => slot.label === mainTimeLabel}
            emptyMessage="이 상권·업종의 시간대 매출 자료가 없어요."
          />
          <p className="muted small">가장 높은 시간대를 100으로 맞춘 값이에요.</p>
        </div>
        <div className="panel">
          <div className="row-between"><h3>연령대별 매출 지수</h3><RealBadge /></div>
          <BarChart
            slots={facts.ageSlots}
            isSelected={(slot) => slot.key === ageGroup}
            emptyMessage="이 상권·업종의 연령대 매출 자료가 없어요."
          />
          <p className="muted small">50대 이상은 50대·60대 이상 합산이에요.</p>
        </div>
        <div className="panel">
          <div className="row-between"><h3>요일별 매출 지수</h3><RealBadge /></div>
          <BarChart
            slots={facts.daySlots}
            isSelected={isDaySelected}
            emptyMessage="이 상권·업종의 요일별 매출 자료가 없어요."
          />
          <p className="muted small">가장 높은 요일을 100으로 맞춘 값이에요.</p>
        </div>
      </div>

      <div className="three-col">
        <div className="panel">
          <p className="muted small">입력한 월 매출 목표</p>
          <p className="stat">{won(targetMonthlySales, '미입력')}</p>
        </div>
        <div className="panel">
          <p className="muted small">필요한 월 주문 수</p>
          <p className="stat">
            {hasSalesAndPrice ? `약 ${Math.round(monthlyOrders).toLocaleString()}건` : '미입력'}
          </p>
          <p className="muted small">목표 ÷ 메뉴 가격 (1주문 1메뉴 가정)</p>
        </div>
        <div className="panel">
          <p className="muted small">하루 필요한 주문 수</p>
          <p className="stat">
            {hasSalesAndPrice ? `약 ${Math.round(dailyOrders).toLocaleString()}건` : '미입력'}
          </p>
          <p className="muted small">{operatingDaysLabel}</p>
        </div>
      </div>
    </section>
  )
}

// 공통 막대 차트. 사용자가 고른 조건에 맞는 막대만 진하게 칠한다.
function BarChart({ slots, isSelected, emptyMessage }) {
  if (!slots || slots.length === 0) return <p className="muted">{emptyMessage}</p>
  return (
    <div className="time-chart" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
      {slots.map((s) => {
        const selected = isSelected ? isSelected(s) : false
        return (
          <div key={s.key || s.label} className="time-bar">
            <span className="time-value">{s.index}</span>
            <div className="time-track">
              <div
                className={selected ? 'time-fill selected' : 'time-fill'}
                style={{ height: `${s.index}%` }}
              />
            </div>
            <span className="time-label">{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}
