import { Link } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import MapSketch from '../components/MapSketch.jsx'
import { ZONES } from '../constants/flow.js'
import { DummyBadge } from '../components/Badges.jsx'

// 지도 입지 비교 (전부 더미). 실제 지도는 경계 데이터와 좌표 변환이 필요해 프로토타입에서는 그림으로 대신한다.
export default function MapComparePage() {
  const { base } = useAnswers()
  const best = ZONES.find((z) => z.id === 'B')

  return (
    <div className="page wide">
      <div className="row-between wrap">
        <div>
          <h1 className="title">어디서 팔아야 할까? <DummyBadge /></h1>
          <p className="muted">같은 음식도 입지에 따라 달라져요.</p>
        </div>
        <div className="pill-row">
          <span className="chip static">🍴 {base.food}</span>
          <span className="chip static">📍 {base.district?.name}</span>
          <span className="chip static">{base.salesMode}</span>
          <Link className="text-link" to="/input?mode=simple">조건 수정</Link>
        </div>
      </div>

      <div className="map-layout">
        <MapSketch placeName={base.district?.name} />
        <aside className="map-panel">
          <p className="muted small">추천 입지 · 기본 상권 비교 · 무료</p>
          <h2>큰길에서 한 블록 안쪽</h2>
          <p className="muted small">주변 상권을 먼저 살펴보세요.</p>
          <p className="score-big">{best.score}<span> / 100</span></p>
          <table className="mini-table">
            <tbody>
              {ZONES.map((z) => (
                <tr key={z.id} className={z.id === 'B' ? 'highlight' : ''}>
                  <td><span className="dot" style={{ background: z.color }} />{z.name}</td>
                  <td>{z.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">시안용 예시 점수 · 예산·운영 계획 미반영</p>
          <Link className="btn primary block" to="/questions/1">내 조건으로 상세 분석하기 →</Link>
          <p className="muted small center">입력한 기본 정보는 유지돼요. 질문 1/5(목표 고객)부터 시작해요.</p>
        </aside>
      </div>
    </div>
  )
}
