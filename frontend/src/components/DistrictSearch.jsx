// 동네 검색. 서버의 서울시 상권 목록(실제 데이터)에서 이름·동·구로 찾는다.
import { useEffect, useState } from 'react'
import { loadDistricts } from '../api.js'

// 사용자가 "성수"처럼 글자로 쳐도, 고르는 순간 서버가 쓰는 상권 코드가 정해진다.
export default function DistrictSearch({ selected, onSelect }) {
  const [districts, setDistricts] = useState([])
  const [status, setStatus] = useState('loading')
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadDistricts()
      .then((list) => {
        setDistricts(list)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const text = keyword.trim()
  const matches = text
    ? districts.filter((d) => `${d.name} ${d.dong} ${d.gu}`.includes(text)).slice(0, 8)
    : []

  function choose(district) {
    onSelect(district)
    setKeyword('')
    setOpen(false)
  }

  return (
    <div className="district-search">
      <div className="input-with-icon">
        <span aria-hidden="true">📍</span>
        <input
          value={open ? keyword : selected ? `서울 ${selected.gu} ${selected.name} (${selected.dong})` : keyword}
          placeholder={status === 'loading' ? '상권 목록을 불러오는 중…' : '동네·역·상권 이름 (예: 성수)'}
          onFocus={() => setOpen(true)}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      {status === 'error' && <p className="error">상권 목록을 불러오지 못했어요. 새로고침해 주세요.</p>}
      {open && text && (
        <ul className="search-results">
          {matches.length === 0 && <li className="muted">‘{text}’과(와) 맞는 상권이 없어요.</li>}
          {matches.map((d) => (
            <li key={d.code}>
              <button type="button" onClick={() => choose(d)}>
                <strong>{d.name}</strong>
                <span>{d.gu} {d.dong} · {d.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="field-hint">서울시 상권 {districts.length ? `${districts.length.toLocaleString()}곳` : ''} 중에서 골라요. (실제 API)</p>
    </div>
  )
}
