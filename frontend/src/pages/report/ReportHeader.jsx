import { useState } from 'react'
import SummaryBar from '../../components/SummaryBar.jsx'
import { won } from '../../format.js'
import { labelOf } from './reportLabels.js'
import { TOTAL_QUESTIONS } from '../../constants/questions.js'

// 보고서 제목, 저장·다운로드 버튼, 입력한 계획 요약
export default function ReportHeader({ base, answers, plan }) {
  const [notice, setNotice] = useState('')
  const { targetMonthlySales } = plan.demand
  const { menuPrice, startupCapital, monthlyCapital } = plan.strategy

  return (
    <>
      <div className="row-between wrap">
        <div>
          <span className="pill">내 아이디어 상세 분석 · 보고서</span>
          <h1 className="title">{base.district?.name}에서 {base.food}를 판다면</h1>
          <p className="muted">{TOTAL_QUESTIONS}개 답변으로 살펴본 입지, 수요, 비용과 준비 과제입니다.</p>
        </div>
        <div className="pill-row">
          <button type="button" className="btn ghost" onClick={() => setNotice('아이디어 저장은 더미예요 (로그인·저장 API 없음).')}>아이디어 저장</button>
          <button type="button" className="btn primary" onClick={() => setNotice('보고서 다운로드는 더미예요.')}>보고서 다운로드</button>
        </div>
      </div>
      {notice && <p className="dummy-banner inline">{notice}</p>}

      <SummaryBar analyzedBase={base} />
      <div className="recap">
        <div><p className="muted small">고객 · 판매 계획</p>
          <strong>{labelOf('customerType', answers.customerType)} / {labelOf('ageGroup', answers.ageGroup)} / {labelOf('visitPurpose', answers.visitPurpose)}</strong>
          <p className="muted small">{labelOf('businessDays', answers.businessDays)} · {labelOf('mainTime', answers.mainTime)} 중심 / {base.salesModes.join(' · ') || '판매 방식 미정'}</p></div>
        <div><p className="muted small">매출 · 점포 계획</p>
          <strong>월 목표 {won(targetMonthlySales)} · 메뉴 {won(menuPrice)}</strong>
          <p className="muted small">{answers.areaPyeong ?? '-'}평 · {answers.seatCount ?? '-'}좌석 · {answers.tableCount ?? '-'}테이블 · 하루 {answers.dailyTurns ?? '-'}회전</p></div>
        <div><p className="muted small">자금 · 운영 계획</p>
          <strong>자본금 {won(startupCapital)} · 월 운영 자금 {won(monthlyCapital)}</strong>
          <p className="muted small">{labelOf('experience', answers.experience)} · {labelOf('participation', answers.participation)}</p></div>
      </div>
    </>
  )
}
