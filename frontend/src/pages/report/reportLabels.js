// 보고서 화면에서 쓰는 선택지 라벨 변환과 평가 항목 추출을 담당한다.
import { QUESTION_STEPS } from '../../constants/questions.js'

export function labelOf(key, value) {
  for (const step of QUESTION_STEPS) {
    const q = step.questions.find((item) => item.key === key)
    const option = q?.options.find((o) => o.value === value)
    if (option) return option.label
  }
  return '미정'
}

export function criteriaOf(assessment) {
  return assessment?.categories?.flatMap((category) => category.criteria ?? []) ?? []
}