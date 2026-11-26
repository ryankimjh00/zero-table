import { Link, Navigate } from 'react-router-dom'
import { useAnswers } from '../../state/answersContext.js'
import FlowStepper from '../../components/FlowStepper.jsx'
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
  const { base, answers, detailResult } = useAnswers()
  if (!detailResult) return <Navigate to="/questions/1" replace />

  const { assessment, facts, requestBody: plan } = detailResult

  return (
    <div className="page wide">
      <FlowStepper current={4} />
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
        <Link className="btn ghost" to="/">새 아이디어 분석</Link>
      </div>
    </div>
  )
}
