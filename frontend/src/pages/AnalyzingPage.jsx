import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import { assess, loadDistrictFacts } from '../api.js'

// 분석 중: 서버에 요청을 보내고, 응답이 오면 결과 화면으로 넘어간다.
// mode=simple은 기본 정보만, mode=detail은 14개 답변까지 보낸다.
export default function AnalyzingPage() {
  const [params] = useSearchParams()
  const isDetail = params.get('mode') === 'detail'
  const navigate = useNavigate()
  const { base, baseBody, detailBody, setSimpleResult, setDetailResult } = useAnswers()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false // 화면을 떠난 뒤 늦게 온 응답은 무시한다
    const body = isDetail ? detailBody() : baseBody()

    Promise.all([assess(body), loadDistrictFacts(body.districtCode, body.industryCode)])
      .then(([assessment, facts]) => {
        if (cancelled) return
        const result = { assessment, facts, requestBody: body }
        if (isDetail) {
          setDetailResult(result)
          navigate('/report', { replace: true })
        } else {
          setSimpleResult(result)
          navigate('/result', { replace: true })
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })

    return () => {
      cancelled = true
    }
    // 이 화면은 들어올 때 한 번만 요청하면 되므로 의존성을 모드로만 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetail])

  return (
    <div className="page center-page">
      {error ? (
        <>
          <h1 className="title">분석하지 못했어요.</h1>
          <p className="error">{error}</p>
          <Link className="btn primary" to={isDetail ? '/questions/3' : '/input?mode=simple'}>조건 다시 보기</Link>
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
          <Link className="text-link" to={isDetail ? '/questions/3' : '/input?mode=simple'}>조건 다시 보기</Link>
        </>
      )}
    </div>
  )
}
