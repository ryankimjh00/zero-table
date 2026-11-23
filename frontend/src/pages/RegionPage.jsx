import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import { loadDistricts } from '../api.js'
import { DummyBadge } from '../components/Badges.jsx'

// 지역 미정: 추천 동네 3곳. 추천 API가 없어서 카드 내용과 점수는 더미다.
// 대신 카드를 고르면 실제 상권 코드로 바꿔 넣어서, 이후 흐름은 실제 API로 이어진다.
const RECOMMENDED = [
  { code: '3110131', title: '성수동', text: ['유동인구와 주변 임대료를', '함께 비교해보세요.'], score: 74 },
  { code: '3120052', title: '성수역 주변', text: ['점심 시간의 수요와', '유사한 매장을 살펴보세요.'], score: 72 },
  { code: '3120051', title: '뚝섬역 주변', text: ['일상적인 방문 수요와', '주거 지역의 흐름을 확인하세요.'], score: 70 },
]

export default function RegionPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'detail' ? 'detail' : 'simple'
  const navigate = useNavigate()
  const { base, setBase } = useAnswers()
  const [error, setError] = useState('')

  async function choose(code) {
    try {
      const districts = await loadDistricts()
      const district = districts.find((d) => d.code === code)
      setBase({ ...base, district })
      navigate(`/input?mode=${mode}`)
    } catch {
      setError('상권 정보를 불러오지 못했어요.')
    }
  }

  return (
    <div className="page">
      <Link className="text-link" to={`/input?mode=${mode}`}>← 아이디어 입력으로</Link>
      <h1 className="title">아직 동네를 정하지 않아도 괜찮아요. <DummyBadge>추천은 더미</DummyBadge></h1>
      <p className="lead">생각한 음식이 잘 맞는 상권부터 살펴보세요.</p>
      <div className="pill-row">
        <span className="chip static">{base.food || '음식 미정'}</span>
        <span className="chip static">{base.salesMode}</span>
      </div>

      <div className="region-cards">
        {RECOMMENDED.map((r, index) => (
          <section key={r.code} className="region-card">
            <span className="muted small">{String(index + 1).padStart(2, '0')}</span>
            <h2>{r.title}</h2>
            <p className="muted">{r.text[0]}<br />{r.text[1]}</p>
            <p className="big-score">{r.score}점</p>
            <button type="button" className="btn primary block" onClick={() => choose(r.code)}>이 동네로 분석하기</button>
          </section>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
