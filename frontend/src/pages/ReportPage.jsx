import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import SummaryBar from '../components/SummaryBar.jsx'
import FlowStepper from '../components/FlowStepper.jsx'
import { ZONES } from '../constants/flow.js'
import { DummyBadge, RealBadge } from '../components/Badges.jsx'
import { QUESTION_STEPS } from '../constants/questions.js'
import { assessmentScore, count, won } from '../format.js'

// 보류 사유 코드 → 화면 문구
const STATUS_LABEL = {
  SCORED: '계산됨',
  MISSING_ANSWER: '답변 미정',
  MISSING_DATA: '비교 자료 부족',
  UNSUPPORTED_DATA: '자료 미제공',
  PENDING_RULE: '기준 협의 중',
}

// 한 달 영업일 가정. 시안 계산식(하루 필요 주문 수)에 쓰며, 질문으로 받지 않아 고정한다.
const ASSUMED_OPERATING_DAYS = 22

// 질문 선택지 값 → 화면 글자 (예: WORKER → 직장인)
function labelOf(key, value) {
  for (const step of QUESTION_STEPS) {
    const q = step.questions.find((item) => item.key === key)
    const option = q?.options.find((o) => o.value === value)
    if (option) return option.label
  }
  return '미정'
}

export default function ReportPage() {
  const { base, answers, detailResult } = useAnswers()
  const [notice, setNotice] = useState('')
  if (!detailResult) return <Navigate to="/questions/1" replace />

  const { assessment, facts } = detailResult
  const score = assessmentScore(assessment)
  const target = detailResult.requestBody.demand.targetMonthlySales
  const price = detailResult.requestBody.strategy.menuPrice
  const monthlyOrders = target && price ? target / price : null
  const dailyOrders = monthlyOrders ? monthlyOrders / ASSUMED_OPERATING_DAYS : null
  const capital = detailResult.requestBody.strategy.startupCapital

  return (
    <div className="page wide">
      <FlowStepper current={4} />

      <div className="row-between wrap">
        <div>
          <span className="pill">내 아이디어 상세 분석 · 보고서</span>
          <h1 className="title">{base.district?.name}에서 {base.food}를 판다면</h1>
          <p className="muted">14개 답변으로 살펴본 입지, 수요, 비용과 준비 과제입니다.</p>
        </div>
        <div className="pill-row">
          <button type="button" className="btn ghost" onClick={() => setNotice('아이디어 저장은 더미예요 (로그인·저장 API 없음).')}>아이디어 저장</button>
          <button type="button" className="btn primary" onClick={() => setNotice('보고서 다운로드는 더미예요.')}>보고서 다운로드</button>
        </div>
      </div>
      {notice && <p className="dummy-banner inline">{notice}</p>}

      <SummaryBar />
      <div className="recap">
        <div><p className="muted small">고객 · 판매 계획</p>
          <strong>{labelOf('customerType', answers.customerType)} / {labelOf('ageGroup', answers.ageGroup)} / {labelOf('visitPurpose', answers.visitPurpose)}</strong>
          <p className="muted small">{labelOf('businessDays', answers.businessDays)} · {labelOf('mainTime', answers.mainTime)} 중심 / {base.salesMode}</p></div>
        <div><p className="muted small">매출 · 점포 계획</p>
          <strong>월 목표 {won(target)} · 메뉴 {won(price)}</strong>
          <p className="muted small">{answers.areaPyeong ?? '-'}평 · {answers.seatCount ?? '-'}좌석 · {answers.tableCount ?? '-'}테이블 · 하루 {answers.dailyTurns ?? '-'}회전</p></div>
        <div><p className="muted small">자금 · 운영 계획</p>
          <strong>자본금 {won(capital)} · 월 운영 자금 {won(detailResult.requestBody.strategy.monthlyCapital)}</strong>
          <p className="muted small">{labelOf('experience', answers.experience)} · {labelOf('participation', answers.participation)}</p></div>
      </div>

      <section className="score-banner">
        <div>
          <p className="small">종합 점수 <RealBadge /></p>
          {score === null ? <h2>산정 보류</h2> : <p className="score-big">{score}<span> / 100점</span></p>}
        </div>
        <div>
          <h2>평가 배점 {assessment.coveragePercent}%</h2>
          <p className="small">
            평가 가능한 항목의 결과를 100점으로 환산해요. 규칙 {assessment.ruleVersion}
          </p>
        </div>
      </section>

      <nav className="report-tabs">
        <a href="#location">01 입지 비교</a>
        <a href="#demand">02 고객과 수요</a>
        <a href="#competition">03 경쟁과 가격</a>
        <a href="#cost">04 비용과 자본</a>
        <a href="#criteria">05 항목별 평가</a>
      </nav>

      <section id="location" className="report-section">
        <p className="eyebrow">01 / 입지 비교 <DummyBadge /></p>
        <h2 className="section-title">같은 동네에서도, 자리는 다르게 작동해요</h2>
        <table className="data-table">
          <thead><tr><th>후보 지역</th><th>예시 적합도</th><th>수요</th><th>경쟁</th><th>비용</th></tr></thead>
          <tbody>
            {ZONES.map((z) => (
              <tr key={z.id} className={z.id === 'B' ? 'highlight' : ''}>
                <td>{z.id} {z.name}</td><td>{z.score}점</td>
                <td>{z.id === 'C' ? '목적 방문 확보 필요' : '유입 기회 있음'}</td>
                <td>{z.id === 'A' ? '경쟁 노출이 큼' : '차별화 여지 검토'}</td>
                <td>{z.id === 'A' ? '임대 부담 우려' : '비용 균형 기대'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="demand" className="report-section">
        <p className="eyebrow">02 / 고객과 수요</p>
        <h2 className="section-title">{labelOf('mainTime', answers.mainTime)} 시간대를 중심으로 살펴봐요</h2>
        <div className="two-col">
          <div className="panel">
            <div className="row-between"><h3>시간대별 매출 지수</h3><RealBadge /></div>
            <TimeChart slots={facts.timeSlots} selected={labelOf('mainTime', answers.mainTime)} />
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
          <div className="panel"><p className="muted small">입력한 월 매출 목표</p><p className="stat">{won(target)}</p></div>
          <div className="panel"><p className="muted small">필요한 월 주문 수</p><p className="stat">{monthlyOrders ? `약 ${Math.round(monthlyOrders).toLocaleString()}건` : '계산 불가'}</p>
            <p className="muted small">목표 ÷ 메뉴 가격 (1주문 1메뉴 가정)</p></div>
          <div className="panel"><p className="muted small">하루 필요한 주문 수</p><p className="stat">{dailyOrders ? `약 ${Math.round(dailyOrders)}건` : '계산 불가'}</p>
            <p className="muted small">월 {ASSUMED_OPERATING_DAYS}일 영업 가정</p></div>
        </div>
      </section>

      <section id="competition" className="report-section">
        <p className="eyebrow">03 / 경쟁과 가격</p>
        <h2 className="section-title">{won(price)}에 납득할 이유를 설계하세요</h2>
        <div className="two-col">
          <div className="panel">
            <h3>상권 경쟁 참고값 <RealBadge /></h3>
            <ul className="fact-list">
              <li><span>같은 업종 점포 수</span><strong>{count(facts.sameIndustryStores, '곳')}</strong></li>
              <li><span>결제 1건당 금액</span><strong>{won(assessment.indicators?.averagePaymentAmount)}</strong></li>
              <li><span>점포당 월매출 참고값</span><strong>{won(assessment.indicators?.monthlySalesPerStore)}</strong></li>
            </ul>
          </div>
          <div className="panel">
            <h3>가격을 비교하는 기준 <DummyBadge>예시</DummyBadge></h3>
            <PriceBars price={price} />
            <p className="muted small">가상 메뉴 비교예요. 같은 메뉴의 주변 시세 자료가 없어 서버에서도 보류된 항목이에요.</p>
          </div>
        </div>
      </section>

      <section id="cost" className="report-section">
        <p className="eyebrow">04 / 비용과 자본</p>
        <h2 className="section-title">좋은 자리보다 먼저, 버틸 수 있는 비용 구조인지 확인해요</h2>
        <div className="two-col">
          <div className="panel">
            <div className="row-between"><h3>초기 자본금 {won(capital)}</h3><DummyBadge>배분 예시</DummyBadge></div>
            <ul className="fact-list">
              {[['보증금', 0.4], ['인테리어·시설', 0.3], ['주방·포장 장비', 0.16], ['예비 자금', 0.14]].map(([name, ratio]) => (
                <li key={name}><span>{name}</span><strong>{capital ? won(capital * ratio) : '-'} · {ratio * 100}%</strong></li>
              ))}
            </ul>
          </div>
          <div className="panel warn">
            <p className="small">먼저 확인할 항목</p>
            <h3>월 {won(detailResult.requestBody.strategy.monthlyCapital)}은 임대료만을 위한 예산이 아니에요.</h3>
            <p className="small">임대료·관리비·인건비·재료비·포장재 등 전체 운영 자금입니다. 실제 임대료가 아직 입력되지 않아 운영 가능 여부는 판단할 수 없어요.</p>
          </div>
        </div>
      </section>

      <section id="criteria" className="report-section">
        <p className="eyebrow">05 / 항목별 평가 <RealBadge /></p>
        <h2 className="section-title">서버가 계산한 항목과 보류된 항목</h2>
        {assessment.categories.map((c) => (
          <div key={c.id} className="panel">
            <div className="row-between">
              <h3>{c.name}</h3>
              <strong>{c.score === null ? '보류' : `획득 ${c.score}점`} <span className="muted small">· 배점 {c.maxScore}점</span></strong>
            </div>
            <ul className="criteria-list">
              {c.criteria.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span className={`status ${item.status}`}>{STATUS_LABEL[item.status] ?? item.status}</span>
                  <span className="criteria-value">
                    {item.score === null ? item.reason : `획득 ${item.score}점 · 배점 ${item.maxScore}점`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {assessment.suggestions?.length > 0 && (
          <div className="panel">
            <h3>영업 시간 대안</h3>
            {assessment.suggestions.map((s) => (
              <p key={s.suggestedTime}>{labelOf('mainTime', s.currentTime)}({s.currentTimeScore}점) 대신 {labelOf('mainTime', s.suggestedTime)}({s.suggestedTimeScore}점)을 검토해보세요.</p>
            ))}
          </div>
        )}
        <p className="muted small">
          출처: {assessment.sources?.map((s) => `${s.dataset}(${s.matchingRecords}건)`).join(', ')}
        </p>
      </section>

      <section className="report-section notice-box">
        <h3>이 보고서를 읽기 전에 기억하세요</h3>
        <p className="small">서울시 상권 공공데이터를 바탕으로 한 참고 자료예요. 사업 성공이나 수익을 보장하지 않아요. 후보 지역 점수·가격·비용 배분은 예시입니다.</p>
      </section>

      <div className="row-between wrap">
        <Link className="text-link" to="/questions/1">← 추가 질문 답변 수정하기</Link>
        <Link className="btn ghost" to="/">새 아이디어 분석</Link>
      </div>
    </div>
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
