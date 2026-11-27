// 상세 결과 열기 팝업과 광고 시청 후 분석 이동 흐름을 보여 준다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DummyBadge } from '../components/Badges.jsx'
import { analyzingPath, DETAIL_MODE, LAST_QUESTION_STEP, questionsPath } from '../constants/routes.js'

export default function ResultOpenPage() {
  const navigate = useNavigate()
  const [watching, setWatching] = useState(false)

  function watchAd() {
    setWatching(true)
    setTimeout(() => navigate(analyzingPath(DETAIL_MODE)), 1500)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-labelledby="open-title">
        <div className="row-between">
          <span className="pill green">5개 영역 입력 완료</span>
          <button type="button" className="icon-button" aria-label="닫기" onClick={() => navigate(questionsPath(LAST_QUESTION_STEP))}>×</button>
        </div>
        <h1 id="open-title" className="title">상세 적합도와 보고서를 확인해보세요 <DummyBadge>광고 더미</DummyBadge></h1>
        <p className="lead">종합 적합도 · 5개 영역별 평가 · 근거와 개선 방향을 한 번에 볼 수 있어요.</p>
        <div className="check-box">
          <p className="check-title">광고 1회로 이번 상세 결과와 보고서를 함께 열어요</p>
          <ul>
            <li>✓ 이번 분석의 종합 적합도 (상세 점수 포함)</li>
            <li>✓ 5개 영역별 평가 · 근거와 개선 방향</li>
            <li>✓ 보고서 — 열고 나서 추가 광고 없음</li>
          </ul>
        </div>
        <p className="muted small">광고 시청으로 받은 크레딧은 이번 결과를 여는 데 사용돼요.</p>
        <button type="button" className="btn primary block" onClick={watchAd} disabled={watching}>
          {watching ? '광고 시청 중… (더미)' : '광고 보고 크레딧으로 이번 결과 열기'}
        </button>
        <button type="button" className="btn ghost block" onClick={() => navigate(questionsPath(LAST_QUESTION_STEP))}>읽지 않고 닫기</button>
      </div>
    </div>
  )
}