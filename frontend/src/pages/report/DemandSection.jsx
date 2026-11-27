// 보고서 02 고객과 수요: 상권 수요 참고값, 매출 지수 그래프, 목표 매출에 필요한 판매량.
import { RealBadge } from '../../components/Badges.jsx'
import FactsRetryNotice from '../../components/FactsRetryNotice.jsx'
import { isFactFailed } from '../../api.js'
import { count, FAILED_TEXT, won } from '../../format.js'
import { labelOf } from './reportLabels.js'

// 한 달 영업일 기본 가정값. 입력값이 없을 때 사용한다.
const DEFAULT_OPERATING_DAYS = 22

export default function DemandSection({
  facts,
  onRetryFacts,
  mainTime,
  ageGroup,
  businessDays,
  monthlyOperatingDays,
  targetMonthlySales,
  menuPrice,
}) {
  const mainTimeLabel = labelOf('mainTime', mainTime)

  const operatingDays = monthlyOperatingDays || DEFAULT_OPERATING_DAYS
  const operatingDaysLabel = monthlyOperatingDays
    ? `월 ${monthlyOperatingDays}일 영업`
    : `월 ${DEFAULT_OPERATING_DAYS}일 영업 가정`

  // 목표 매출이나 메뉴 가격이 없으면 판매량을 계산할 수 없어 '미입력'으로 표시한다.
  // 반올림하면 목표에 조금 못 미칠 수 있어 올림한다.
  const hasSalesAndPrice = Boolean(targetMonthlySales && menuPrice)
  const monthlySalesQuantity = hasSalesAndPrice ? Math.ceil(targetMonthlySales / menuPrice) : null
  const dailySalesQuantity = hasSalesAndPrice
    ? Math.ceil(targetMonthlySales / menuPrice / operatingDays)
    : null

  // 고른 영업 요일(평일·주말·매일)에 들어가는 요일 막대를 진하게 칠한다
  const isDaySelected = (slot) => {
    if (!businessDays || businessDays === 'UNDECIDED') return false
    if (businessDays === 'ALL') return true
    if (businessDays === 'WEEKDAYS') return !slot.isWeekend
    if (businessDays === 'WEEKENDS') return slot.isWeekend
    return false
  }

  // 불러오지 못한 자료의 칸은 '자료 없음' 대신 '불러오지 못함'으로 쓴다
  const salesFailed = isFactFailed(facts, 'sales')
  const valueOrFailed = (sourceName, text) => (isFactFailed(facts, sourceName) ? FAILED_TEXT : text)
  const chartEmptyMessage = (text) => (salesFailed ? '매출 자료를 불러오지 못했어요.' : text)

  return (
    <section id="demand" className="report-section">
      <p className="eyebrow">02 / 고객과 수요</p>
      <h2 className="section-title">{mainTimeLabel} 시간대를 중심으로 살펴봐요</h2>
      <FactsRetryNotice
        facts={facts}
        usedSources={['sales', 'pedestrians', 'residents']}
        onRetry={onRetryFacts}
      />

      <div className="panel demand-facts-panel">
        <div className="row-between">
          <h3>상권 수요 참고값</h3>
          <RealBadge />
        </div>
        <div className="three-col demand-fact-cards">
          <div className="demand-fact-card">
            <span className="muted small">분기 유동인구</span>
            <strong className="demand-fact-value">{valueOrFailed('pedestrians', count(facts.pedestrians, '명'))}</strong>
          </div>
          <div className="demand-fact-card">
            <span className="muted small">상주인구</span>
            <strong className="demand-fact-value">{valueOrFailed('residents', count(facts.residents, '명'))}</strong>
          </div>
          <div className="demand-fact-card">
            <span className="muted small">분기 업종 추정매출</span>
            <strong className="demand-fact-value">{valueOrFailed('sales', won(facts.quarterSales))}</strong>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="panel">
          <div className="row-between"><h3>시간대별 매출 지수</h3><RealBadge /></div>
          <BarChart
            slots={facts.timeSlots}
            isSelected={(slot) => slot.label === mainTimeLabel}
            emptyMessage={chartEmptyMessage('이 상권·업종의 시간대 매출 자료가 없어요.')}
          />
          <p className="muted small">가장 높은 시간대를 100으로 맞춘 값이에요.</p>
        </div>
        <div className="panel">
          <div className="row-between"><h3>연령대별 매출 지수</h3><RealBadge /></div>
          <BarChart
            slots={facts.ageSlots}
            isSelected={(slot) => slot.key === ageGroup}
            emptyMessage={chartEmptyMessage('이 상권·업종의 연령대 매출 자료가 없어요.')}
          />
          <p className="muted small">50대 이상은 50대·60대 이상 합산이에요.</p>
        </div>
        <div className="panel">
          <div className="row-between"><h3>요일별 매출 지수</h3><RealBadge /></div>
          <BarChart
            slots={facts.daySlots}
            isSelected={isDaySelected}
            emptyMessage={chartEmptyMessage('이 상권·업종의 요일별 매출 자료가 없어요.')}
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
          <p className="muted small">대표 메뉴 기준 필요 판매량 (월)</p>
          <p className="stat">
            {hasSalesAndPrice ? `${monthlySalesQuantity.toLocaleString()}개` : '미입력'}
          </p>
          <p className="muted small">목표 매출 ÷ 대표 메뉴 가격</p>
        </div>
        <div className="panel">
          <p className="muted small">대표 메뉴 기준 필요 판매량 (하루)</p>
          <p className="stat">
            {hasSalesAndPrice ? `${dailySalesQuantity.toLocaleString()}개` : '미입력'}
          </p>
          <p className="muted small">{operatingDaysLabel}</p>
        </div>
      </div>
      <p className="muted small">추가 메뉴·주류·할인은 반영하지 않은 값이에요.</p>
    </section>
  )
}

// 공통 막대 차트. 사용자가 고른 조건에 맞는 막대만 진하게 칠한다.
function BarChart({ slots, isSelected, emptyMessage }) {
  if (!slots || slots.length === 0) return <p className="muted">{emptyMessage}</p>
  return (
    <div className="bar-chart">
      {slots.map((s) => {
        const selected = isSelected ? isSelected(s) : false
        return (
          <div key={s.key || s.label} className="bar-item">
            <span className="bar-value">{s.index}</span>
            <div className="bar-track">
              <div
                className={selected ? 'bar-fill selected' : 'bar-fill'}
                style={{ height: `${s.index}%` }}
              />
            </div>
            <span>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}
