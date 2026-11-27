import { Link, Navigate } from 'react-router-dom'
import { useAnswers } from '../../state/answersContext.js'
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
  const { base: currentBase, answers: currentAnswers, detailResult, resetAll } = useAnswers()
  if (!detailResult) return <Navigate to="/questions/1" replace />

  // 보고서는 지금 입력이 아니라 분석한 순간의 입력(input)으로 그린다.
  const { assessment, facts, requestBody: plan, input } = detailResult
  const { base, answers } = input

  return (
    <div className="page wide">
      <FlowStepper current={4} />
      <OutdatedNotice
        analyzedInput={input}
        currentInput={{ base: currentBase, answers: currentAnswers }}
        retryTo="/analyzing?mode=detail"
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
      />
      <DemandSection
        facts={facts}
        mainTime={answers.mainTime}
        ageGroup={answers.ageGroup}
        businessDays={answers.businessDays}
        monthlyOperatingDays={plan.demand?.monthlyOperatingDays}
        targetMonthlySales={plan.demand.targetMonthlySales}
        menuPrice={plan.strategy.menuPrice}
      />
      <CompetitionSection
        sameIndustryStores={facts.sameIndustryStores}
        franchiseStores={facts.franchiseStores}
        openRate={facts.openRate}
        closeRate={facts.closeRate}
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
        <Link className="text-link" to="/questions/1">← 추가 질문 답변 수정하기</Link>
        <Link className="btn ghost" to="/" onClick={resetAll}>새 아이디어 분석</Link>
      </div>
    </div>
  )
}
