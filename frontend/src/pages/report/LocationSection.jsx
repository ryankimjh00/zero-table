import { useEffect, useState } from 'react'
import { isFactFailed, loadNearbyDistrictsComparison, retryFailedFacts } from '../../api.js'
import { RealBadge } from '../../components/Badges.jsx'
import FactsRetryNotice from '../../components/FactsRetryNotice.jsx'
import { count, FAILED_TEXT, won } from '../../format.js'

// 표의 줄 순서와 값 표시 방법. 기준 상권과 비교 상권에 같은 규칙을 쓴다.
// source: 그 줄의 값이 들어 있는 상권 자료 이름 (불러오지 못했는지 확인할 때 쓴다)
const COMPARISON_ROWS = [
  { label: '분기 추정매출', source: 'sales', format: (facts) => won(facts?.quarterSales) },
  { label: '같은 업종 점포 수', source: 'stores', format: (facts) => count(facts?.sameIndustryStores, '곳') },
  { label: '분기 유동인구', source: 'pedestrians', format: (facts) => count(facts?.pedestrians, '명') },
  { label: '상주인구', source: 'residents', format: (facts) => count(facts?.residents, '명') },
]

function formatCell(row, facts) {
  return isFactFailed(facts, row.source) ? FAILED_TEXT : row.format(facts)
}

function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`
  return `${meters}m`
}

// 01 입지 비교: 기준 상권과 가장 가까운 주변 상권 3곳(반경 2km 내외)을 같은 업종 기준으로 비교
export default function LocationSection({ currentDistrict, industryCode, currentFacts, onRetryFacts }) {
  const [nearby, setNearby] = useState([])
  const [status, setStatus] = useState('loading')
  // 주변 상권 목록 자체를 못 받았을 때 다시 시도하려고 숫자를 올려 아래 useEffect를 다시 돌린다
  const [loadCount, setLoadCount] = useState(0)
  // 지금 다시 불러오는 중인 비교 상권 코드
  const [retryingCode, setRetryingCode] = useState(null)

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
  }, [currentDistrict?.code, industryCode, loadCount])

  // 비교 상권 하나의 실패한 자료만 다시 받아 그 열만 바꾼다
  async function retryNearby(item) {
    setRetryingCode(item.district.code)
    try {
      const facts = await retryFailedFacts(item.facts, item.district.code, industryCode)
      setNearby((prev) => prev.map((n) => (n.district.code === item.district.code ? { ...n, facts } : n)))
    } finally {
      setRetryingCode(null)
    }
  }

  return (
    <section id="location" className="report-section">
      <p className="eyebrow">01 / 입지 비교</p>
      <h2 className="section-title">주변 상권과 비교해 내 위치의 경쟁력을 확인해요</h2>
      <FactsRetryNotice
        facts={currentFacts}
        usedSources={COMPARISON_ROWS.map((row) => row.source)}
        onRetry={onRetryFacts}
      />

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
                {nearby.map((item) => (
                  <th scope="col" key={item.district.code}>
                    {item.district.name}
                    <span className="compare-sub">{formatDistance(item.district.distance)}</span>
                    {item.facts.failedSources?.length > 0 && (
                      <span className="compare-sub">
                        <button
                          type="button"
                          className="link-button text-link"
                          onClick={() => retryNearby(item)}
                          disabled={retryingCode === item.district.code}
                        >
                          {retryingCode === item.district.code ? '불러오는 중…' : '다시 불러오기'}
                        </button>
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="is-base">{formatCell(row, currentFacts)}</td>
                  {nearby.map(({ district, facts }) => (
                    <td key={district.code}>{formatCell(row, facts)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {status === 'loading' && <p className="muted small">주변 상권 자료를 불러오는 중이에요.</p>}
        {status === 'error' && (
          <p className="muted small">
            주변 상권 목록을 불러오지 못했어요.{' '}
            <button type="button" className="link-button text-link" onClick={() => setLoadCount((n) => n + 1)}>
              다시 불러오기
            </button>
          </p>
        )}
        {status === 'empty' && <p className="muted small">비교할 주변 상권을 찾지 못했어요.</p>}
        <p className="muted small">같은 분기·같은 업종의 서울시 상권 공공데이터예요. 거리는 상권 중심점 사이의 직선거리예요.</p>
      </div>
    </section>
  )
}
