import { useState } from 'react'
import { FACT_SOURCE_LABELS, isFactFailed } from '../api.js'

// 이 구역에서 쓰는 상권 자료 중 불러오지 못한 것이 있으면 알리고 다시 불러오게 한다.
// usedSources: 이 구역이 쓰는 자료 이름들, onRetry: 실패한 자료를 다시 받아 결과에 반영하는 함수
export default function FactsRetryNotice({ facts, usedSources, onRetry }) {
  const [retrying, setRetrying] = useState(false)
  const failedLabels = usedSources
    .filter((name) => isFactFailed(facts, name))
    .map((name) => FACT_SOURCE_LABELS[name])
  if (failedLabels.length === 0) return null

  async function retry() {
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="panel warn">
      <div className="row-between wrap">
        <div>
          <h3>{failedLabels.join('·')} 자료를 불러오지 못했어요</h3>
          <p className="small">받아 온 자료는 그대로 보여 드려요. 비어 있는 칸만 다시 불러올 수 있어요.</p>
        </div>
        <button type="button" className="btn primary" onClick={retry} disabled={retrying}>
          {retrying ? '불러오는 중…' : '다시 불러오기'}
        </button>
      </div>
    </div>
  )
}
