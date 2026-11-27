// 불러오다 실패한 자료의 칸에 쓰는 문구. 자료가 원래 없는 경우('자료 없음')와 구분한다.
export const FAILED_TEXT = '불러오지 못함'

// 숫자를 화면용 글자로 바꾸는 함수들. 값이 없으면 fallback(기본값: '자료 없음')으로 보여 준다.
export function won(amount, fallback = '자료 없음') {
  if (amount === null || amount === undefined || amount === '') return fallback
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억 원`
  if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}만 원`
  return `${Math.round(amount).toLocaleString()}원`
}

export function count(value, unit) {
  if (value === null || value === undefined) return '자료 없음'
  return `${Math.round(value).toLocaleString()}${unit}`
}

export function percent(value, fallback = '자료 없음') {
  if (value === null || value === undefined || value === '') return fallback
  const num = Number(value)
  if (Number.isNaN(num)) return fallback
  // 소수점 둘째 자리까지 표시하되 불필요한 0 제거
  return `${Number(num.toFixed(1))}%`
}

export function assessmentScore(assessment) {
  if (assessment.availablePoints <= 0) return null
  return assessment.scoreOutOf100
    ?? Math.round(10000 * assessment.earnedScore / assessment.availablePoints) / 100
}
