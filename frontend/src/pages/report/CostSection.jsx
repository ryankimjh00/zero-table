// 보고서 04 비용과 자본: 입력한 자본과 아직 확인하지 않은 비용을 보여 준다.
import { won } from '../../format.js'

// 후보 점포 견적을 받기 전이라 아직 금액을 모르는 비용
const PENDING_COST_ITEMS = ['보증금', '권리금', '시설비', '임대료']

const COST_NOTICE =
  '후보 점포 견적을 받기 전이라 자금이 충분한지는 판단하지 않았어요. 견적을 받은 뒤 위 금액과 비교해 보세요.'

export default function CostSection({ startupCapital, monthlyCapital }) {
  const monthlyBudgetLabel = monthlyCapital ? `월 ${won(monthlyCapital)}` : '월 운영 자금'

  return (
    <section id="cost" className="report-section">
      <p className="eyebrow">04 / 비용과 자본</p>
      <h2 className="section-title">좋은 자리보다 먼저, 버틸 수 있는 비용 구조인지 확인해요</h2>
      <div className="two-col">
        <div className="panel">
          <h3>입력한 자본과 확인 필요 비용</h3>
          <ul className="fact-list">
            <li><span>초기 자본금</span><strong>{won(startupCapital, '미입력')}</strong></li>
            <li><span>월 운영 자금</span><strong>{won(monthlyCapital, '미입력')}</strong></li>
            <li>
              <span>확인 필요 비용</span>
              <strong>{PENDING_COST_ITEMS.join(' · ')}</strong>
            </li>
          </ul>
          <p className="muted small cost-notice">{COST_NOTICE}</p>
        </div>
        <div className="panel warn">
          <p className="small">먼저 확인할 항목</p>
          <h3>{monthlyBudgetLabel}은 임대료만을 위한 예산이 아니에요.</h3>
          <p className="small">임대료·관리비·인건비·재료비·포장재 등 전체 운영 자금입니다. 실제 임대료가 아직 입력되지 않아 운영 가능 여부는 판단할 수 없어요.</p>
        </div>
      </div>
    </section>
  )
}
