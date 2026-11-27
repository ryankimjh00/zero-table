import { Link, Navigate } from 'react-router-dom'
import { useAnswers } from '../../state/answersContext.js'
import { retryFailedFacts } from '../../api.js'
import { analyzingPath, DETAIL_MODE, questionsPath, START_PATH } from '../../constants/routes.js'
import FlowStepper from '../../components/FlowStepper.jsx'
import OutdatedNotice from '../../components/OutdatedNotice.jsx'
import ReportHeader from './ReportHeader.jsx'
import ScoreBanner from './ScoreBanner.jsx'
import LocationSection from './LocationSection.jsx'
import DemandSection from './DemandSection.jsx'
import CompetitionSection from './CompetitionSection.jsx'
import CostSection from './CostSection.jsx'
import CriteriaSection from './CriteriaSection.jsx'
import ReportNotice from './ReportNotice.jsx'

// 상세 분석 보고서. 서버 결과를 꺼내 구역마다 필요한 값만 넘긴다.
export default function ReportPage() {
  const { base: currentBase, answers: currentAnswers, detailResult, setDetailResult, resetAll } = useAnswers()
  if (!detailResult) return <Navigate to={questionsPath(1)} replace />

  // 보고서는 지금 입력이 아니라 분석한 순간의 입력(input)으로 그린다.
  const { assessment, facts, requestBody: plan, input } = detailResult
  const { base, answers } = input

  // 불러오지 못한 상권 자료만 다시 받아 결과에 넣는다. 결과가 바뀌면 새로고침용 저장도 같이 바뀐다.
  async function retryFacts() {
    const retried = await retryFailedFacts(facts, plan.districtCode, plan.industryCode)
    setDetailResult((prev) => ({ ...prev, facts: retried }))
  }

  return (
    <div className="page wide">
      <FlowStepper current={4} />
      <OutdatedNotice
        analyzedInput={input}
        currentInput={{ base: currentBase, answers: currentAnswers }}
        retryTo={analyzingPath(DETAIL_MODE)}
      />
      <ReportHeader base={base} answers={answers} plan={plan} />
      <ScoreBanner assessment={assessment} />

      <nav className="report-tabs">
        <a href="#location">01 입지 비교</a>
        <a href="#demand">02 고객과 수요</a>
        <a href="#competition">03 경쟁과 가격</a>
        <a href="#cost">04 비용과 자본</a>
        <a href="#criteria">05 항목별 평가</a>
      </nav>

      <LocationSection
        currentDistrict={base.district}
        industryCode={base.industryCode}
        currentFacts={facts}
        onRetryFacts={retryFacts}
      />
      <DemandSection
        facts={facts}
        onRetryFacts={retryFacts}
        mainTime={answers.mainTime}
        ageGroup={answers.ageGroup}
        businessDays={answers.businessDays}
        monthlyOperatingDays={plan.demand?.monthlyOperatingDays}
        targetMonthlySales={plan.demand.targetMonthlySales}
        menuPrice={plan.strategy.menuPrice}
      />
      <CompetitionSection
        facts={facts}
        onRetryFacts={retryFacts}
        indicators={assessment.indicators}
        menuPrice={plan.strategy.menuPrice}
        salesModes={base.salesModes}
      />
      <CostSection
        startupCapital={plan.strategy.startupCapital}
        monthlyCapital={plan.strategy.monthlyCapital}
      />
      <CriteriaSection assessment={assessment} quarter={plan.quarter} />
      <ReportNotice assessment={assessment} />

      <div className="row-between wrap">
        <Link className="text-link" to={questionsPath(1)}>← 추가 질문 답변 수정하기</Link>
        <Link className="btn ghost" to={START_PATH} onClick={resetAll}>새 아이디어 분석</Link>
      </div>
    </div>
  )
}
