// 숫자를 화면용 글자로 바꾸는 함수들. 값이 없으면 '자료 없음'으로 보여 준다.
export function won(amount) {
  if (amount === null || amount === undefined) return '자료 없음'
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억 원`
  if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}만 원`
  return `${Math.round(amount).toLocaleString()}원`
}

export function count(value, unit) {
  if (value === null || value === undefined) return '자료 없음'
  return `${Math.round(value).toLocaleString()}${unit}`
}
