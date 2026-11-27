import { Link, Navigate } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import SummaryBar from '../components/SummaryBar.jsx'
import FlowStepper from '../components/FlowStepper.jsx'
import OutdatedNotice from '../components/OutdatedNotice.jsx'
import { RealBadge } from '../components/Badges.jsx'
import { assessmentScore, count, won } from '../format.js'
import { TOTAL_QUESTIONS } from '../constants/questions.js'

export default function SimpleResultPage() {
  const { base: currentBase, simpleResult } = useAnswers()
  if (!simpleResult) return <Navigate to="/input?mode=simple" replace />

  // 결과 문장은 분석한 순간의 기본 입력으로 쓴다.
  const { assessment, facts, input } = simpleResult
  const { base } = input
  const score = assessmentScore(assessment)

  const cards = [
    {
      tag: '수요', tone: 'green',
      title: `분기 유동인구 ${count(facts.pedestrians, '명')}`,
      text: `상주인구 ${count(facts.residents, '명')}. 같은 분기 서울시 상권 자료 기준이에요.`,
    },
    {
      tag: '경쟁', tone: 'blue',
      title: `같은 업종 점포 ${count(facts.sameIndustryStores, '곳')}`,
      text: '같은 메뉴만으로는 눈에 띄기 어려울 수 있어요. 비슷한 업종도 함께 비교해보세요.',
    },
    {
      tag: '비용', tone: 'orange',
      title: `점포당 월매출 참고값 ${won(assessment.indicators?.monthlySalesPerStore)}`,
      text: `결제 1건당 ${won(assessment.indicators?.averagePaymentAmount)}. 임대료 자료는 아직 없어 별도로 확인해야 해요.`,
    },
  ]

  return (
    <div className="page">
      <OutdatedNotice
        analyzedInput={input}
        currentInput={{ base: currentBase }}
        retryTo="/analyzing?mode=simple"
      />
      <span className="pill">간단 분석 결과 · 무료 · 광고 없음</span>
      <p className="muted small">음식·지역·판매 방식 기준의 간단 분석이에요. 예산과 운영 계획은 아직 반영하지 않았어요.</p>
      <h1 className="title">
        {base.district?.name}에서 {base.food}, {score >= 70 ? '시작해볼 만해요.' : '조건을 더 살펴봐야 해요.'}
      </h1>
      <SummaryBar analyzedBase={base} editTo="/input?mode=simple" />

      <div className="result-grid">
        <section className="score-card">
          <div className="row-between">
            <h2>입지 적합도</h2>
            {score !== null && <RealBadge />}
          </div>
          {score === null
            ? <p>산정 보류</p>
            : <><p className="score-big">{score}<span> / 100점</span></p>
              <div className="bar"><span style={{ width: `${score}%` }} /></div></>}
          <p className="muted small">
            {score === null ? '이 상권에서 계산에 사용할 수 있는 자료가 부족해요.'
              : `평가 가능한 항목을 100점으로 환산했어요. 평가 배점 ${assessment.coveragePercent}%`}
          </p>
        </section>

        <section className="insight-card">
          <div className="row-between"><span /><RealBadge /></div>
          {cards.map((c) => (
            <div key={c.tag} className="insight">
              <span className={`insight-tag ${c.tone}`}>{c.tag}</span>
              <div>
                <strong>{c.title}</strong>
                <p className="muted small">{c.text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="upsell">
        <div className="row-between">
          <h2>고객·영업 시간·예산까지 반영해 확인해보세요</h2>
          <span className="src-badge real">추천</span>
        </div>
        <p>5개 영역에 답하면 내 조건별 적합도를 확인해요. 입력한 음식·지역·판매 방식은 그대로 이어가요.</p>
        <p className="accent small">질문 완료 후 광고를 보고 크레딧을 받아 이번 상세 결과와 보고서를 함께 열 수 있어요.</p>
        <Link className="btn primary block" to="/questions/1">내 조건으로 상세 분석하기 →</Link>
        <p className="muted small center">추가 질문 {TOTAL_QUESTIONS}개 (3단계) → 광고 크레딧으로 결과 열기 → 상세 분석</p>
      </section>

      <FlowStepper current={2} />
    </div>
  )
}
