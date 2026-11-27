// 기본 입력: 간단 분석과 상세 분석이 같은 화면을 쓰고 버튼만 다르다.
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import { INDUSTRIES, SALES_MODES } from '../constants/industries.js'
import ChoiceChips from '../components/ChoiceChips.jsx'
import DistrictSearch from '../components/DistrictSearch.jsx'
import FlowStepper from '../components/FlowStepper.jsx'
import { DETAIL_STEPS } from '../constants/flow.js'
import { RealBadge } from '../components/Badges.jsx'
import { analyzingPath, isDetailMode, questionsPath, SIMPLE_MODE } from '../constants/routes.js'

export default function BasicInputPage() {
  const [params] = useSearchParams()
  const isDetail = isDetailMode(params)
  const navigate = useNavigate()
  const { base, setBase } = useAnswers()
  const [error, setError] = useState('')

  function update(changes) {
    setBase({ ...base, ...changes })
  }

  // 누를 때마다 켜고 끈다. 순서는 선택지 순서(매장 식사 → 포장 → 배달)로 맞춘다.
  function toggleSalesMode(mode) {
    const isOn = base.salesModes.includes(mode)
    const salesModes = SALES_MODES.filter((item) => (item === mode ? !isOn : base.salesModes.includes(item)))
    update({ salesModes })
  }

  function submit() {
    // 서버는 업종 코드와 상권 코드가 없으면 계산할 수 없으므로 미리 막는다.
    if (!base.industryCode || !base.district) {
      setError('업종과 동네를 모두 골라 주세요.')
      return
    }
    navigate(isDetail ? questionsPath(1) : analyzingPath(SIMPLE_MODE))
  }

  return (
    <div className="page narrow">
      <div className="pill-row">
        {isDetail ? (
          <><span className="pill">상세 분석</span><span className="pill">기본 정보 + 5개 영역</span></>
        ) : (
          <span className="pill">간단 분석 · 무료 · 광고 없음</span>
        )}
      </div>
      <h1 className="display">내 아이디어가 잘 맞는<br />동네를 찾아보세요.</h1>
      <p className="lead">음식과 지역을 알려주시면 창업 전에 살펴볼 조건을 정리해드려요.</p>

      <div className="form-block">
        <label className="form-label" htmlFor="food">01 어떤 음식을 생각하고 있나요?</label>
        <div className="input-with-icon">
          <span aria-hidden="true">🍴</span>
          <input id="food" value={base.food} placeholder="예: 수제버거" onChange={(e) => update({ food: e.target.value })} />
        </div>
        <label className="form-label small" htmlFor="industry">업종 분류 <span className="muted">(서버는 이 분류로 계산해요)</span></label>
        <select id="industry" value={base.industryCode} onChange={(e) => update({ industryCode: e.target.value })}>
          <option value="">업종을 골라 주세요</option>
          {INDUSTRIES.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}
        </select>
      </div>

      <div className="form-block">
        <p className="form-label">02 어느 동네에서 시작하고 싶나요? <RealBadge /></p>
        <DistrictSearch selected={base.district} onSelect={(district) => update({ district })} />
      </div>

      <div className="form-block">
        <p className="form-label">03 어떻게 판매할 생각인가요?</p>
        <ChoiceChips options={SALES_MODES} selected={base.salesModes} radio={false}
          onSelect={toggleSalesMode} />
        <p className="field-hint">해당하는 판매 방식을 모두 선택해주세요. (화면 표시용 · API에는 없는 항목)</p>
      </div>

      {error && <p className="error">{error}</p>}
      <button type="button" className="btn primary block" onClick={submit}>
        {isDetail ? '상세 질문 시작하기' : '→ 간단 결과 보기'}
      </button>

      <p className="info-strip">
        {isDetail
          ? 'ⓘ 질문 완료 후 광고로 크레딧을 받아 이번 상세 결과와 보고서를 열 수 있어요.'
          : 'ⓘ 분석은 창업 의사결정을 돕는 참고 자료입니다. 점수는 사업 성공 확률이나 수익을 보장하지 않아요.'}
      </p>

      {isDetail ? <FlowStepper steps={DETAIL_STEPS} current={1} /> : <FlowStepper current={1} />}
    </div>
  )
}
