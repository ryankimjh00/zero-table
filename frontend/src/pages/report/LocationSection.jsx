import { useEffect, useState } from 'react'
import { loadNearbyDistrictsComparison } from '../../api.js'
import { RealBadge } from '../../components/Badges.jsx'
import { count, won } from '../../format.js'

// 표의 줄 순서와 값 표시 방법. 기준 상권과 비교 상권에 같은 규칙을 쓴다.
const COMPARISON_ROWS = [
  { label: '분기 추정매출', format: (facts) => won(facts?.quarterSales) },
  { label: '같은 업종 점포 수', format: (facts) => count(facts?.sameIndustryStores, '곳') },
  { label: '분기 유동인구', format: (facts) => count(facts?.pedestrians, '명') },
  { label: '상주인구', format: (facts) => count(facts?.residents, '명') },
]

function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`
  return `${meters}m`
}

// 01 입지 비교: 기준 상권과 가장 가까운 주변 상권 3곳(반경 2km 내외)을 같은 업종 기준으로 비교
export default function LocationSection({ currentDistrict, industryCode, currentFacts }) {
  const [nearby, setNearby] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!currentDistrict?.code || !industryCode) {
      setStatus('empty')
      return
    }

    // 결과가 오기 전에 화면을 벗어나면 늦게 온 결과로 상태를 바꾸지 않는다
    let cancelled = false
    setStatus('loading')
    loadNearbyDistrictsComparison(currentDistrict.code, industryCode)
      .then((results) => {
        if (cancelled) return
        setNearby(results)
        setStatus(results.length > 0 ? 'done' : 'empty')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [currentDistrict?.code, industryCode])

  return (
    <section id="location" className="report-section">
      <p className="eyebrow">01 / 입지 비교</p>
      <h2 className="section-title">주변 상권과 비교해 내 위치의 경쟁력을 확인해요</h2>

      <div className="panel">
        <div className="row-between">
          <h3>가까운 상권 3곳과 비교</h3>
          <RealBadge />
        </div>

        <div className="table-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">구분</th>
                <th scope="col" className="is-base">
                  {currentDistrict?.name ?? '내 상권'}
                  <span className="compare-sub">기준 상권</span>
                </th>
                {nearby.map(({ district }) => (
                  <th scope="col" key={district.code}>
                    {district.name}
                    <span className="compare-sub">{formatDistance(district.distance)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="is-base">{row.format(currentFacts)}</td>
                  {nearby.map(({ district, facts }) => (
                    <td key={district.code}>{row.format(facts)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {status === 'loading' && <p className="muted small">주변 상권 자료를 불러오는 중이에요.</p>}
        {status === 'error' && <p className="muted small">주변 상권 자료를 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p>}
        {status === 'empty' && <p className="muted small">비교할 주변 상권을 찾지 못했어요.</p>}
        <p className="muted small">같은 분기·같은 업종의 서울시 상권 공공데이터예요. 거리는 상권 중심점 사이의 직선거리예요.</p>
      </div>
    </section>
  )
}
