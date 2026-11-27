// 분석 중: 서버에 요청을 보내고, 응답이 오면 결과 화면으로 넘어간다.
// 간단 분석은 기본 정보만, 상세 분석은 추가 질문 답변까지 보낸다.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import { assess, loadDistrictFacts } from '../api.js'
import {
  inputPath, isDetailMode, LAST_QUESTION_STEP, questionsPath, REPORT_PATH, SIMPLE_MODE, SIMPLE_RESULT_PATH,
} from '../constants/routes.js'

export default function AnalyzingPage() {
  const [params] = useSearchParams()
  const isDetail = isDetailMode(params)
  const navigate = useNavigate()
  const { base, answers, baseBody, detailBody, setSimpleResult, setDetailResult } = useAnswers()
  const [error, setError] = useState('')
  // [다시 시도]를 누르면 숫자를 올려 아래 useEffect가 같은 조건으로 다시 요청하게 한다
  const [attempt, setAttempt] = useState(0)
  // 오류가 나거나 분석을 멈출 때 돌아갈 입력 화면
  const editPath = isDetail ? questionsPath(LAST_QUESTION_STEP) : inputPath(SIMPLE_MODE)

  function retry() {
    setError('')
    setAttempt((n) => n + 1)
  }

  useEffect(() => {
    let cancelled = false // 화면을 떠난 뒤 늦게 온 응답은 무시한다
    const body = isDetail ? detailBody() : baseBody()

    // 상권 자료는 일부가 실패해도 결과에 실패 목록을 담아 돌아온다.
    // 그래서 여기서 실패로 끝나는 경우는 점수 계산(assess)이 실패했을 때뿐이다.
    Promise.all([assess(body), loadDistrictFacts(body.districtCode, body.industryCode)])
      .then(([assessment, facts]) => {
        if (cancelled) return
        // 결과 화면은 분석한 순간의 입력(input)만 읽는다. 간단 분석은 기본 입력만 쓴다.
        const input = isDetail ? { base, answers } : { base }
        const result = { assessment, facts, requestBody: body, input }
        if (isDetail) {
          setDetailResult(result)
          navigate(REPORT_PATH, { replace: true })
        } else {
          setSimpleResult(result)
          navigate(SIMPLE_RESULT_PATH, { replace: true })
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })

    return () => {
      cancelled = true
    }
    // 들어올 때와 [다시 시도]를 눌렀을 때만 요청하면 되므로 의존성을 모드와 시도 횟수로만 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetail, attempt])

  return (
    <div className="page center-page">
      {error ? (
        <>
          <h1 className="title">분석하지 못했어요.</h1>
          <p className="error">{error}</p>
          <button type="button" className="btn primary" onClick={retry}>다시 시도</button>
          <Link className="text-link" to={editPath}>조건 다시 보기</Link>
        </>
      ) : (
        <>
          <div className="spinner" aria-hidden="true" />
          <h1 className="title">아이디어와 어울리는 상권을 찾고 있어요.</h1>
          <p className="lead">
            {base.district?.name} 주변 수요와 경쟁 상황을 살펴보고<br />시작 전에 확인할 조건을 정리하고 있어요.
          </p>
          <div className="progress"><span /></div>
          <button type="button" className="btn primary" disabled>분석 중</button>
          <Link className="text-link" to={editPath}>조건 다시 보기</Link>
        </>
      )}
    </div>
  )
}
