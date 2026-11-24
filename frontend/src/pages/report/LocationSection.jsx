import { ZONES } from '../../constants/flow.js'
import { DummyBadge } from '../../components/Badges.jsx'

// 01 입지 비교. 후보 상권 기준이 정해지기 전이라 예시 값으로 채운다.
export default function LocationSection() {
  return (
    <section id="location" className="report-section">
      <p className="eyebrow">01 / 입지 비교 <DummyBadge /></p>
      <h2 className="section-title">같은 동네에서도, 자리는 다르게 작동해요</h2>
      <table className="data-table">
        <thead><tr><th>후보 지역</th><th>예시 적합도</th><th>수요</th><th>경쟁</th><th>비용</th></tr></thead>
        <tbody>
          {ZONES.map((z) => (
            <tr key={z.id} className={z.id === 'B' ? 'highlight' : ''}>
              <td>{z.id} {z.name}</td><td>{z.score}점</td>
              <td>{z.id === 'C' ? '목적 방문 확보 필요' : '유입 기회 있음'}</td>
              <td>{z.id === 'A' ? '경쟁 노출이 큼' : '차별화 여지 검토'}</td>
              <td>{z.id === 'A' ? '임대 부담 우려' : '비용 균형 기대'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
