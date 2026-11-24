import { QUESTION_STEPS } from '../../constants/questions.js'

// 질문 선택지 값 → 화면 글자 (예: WORKER → 직장인)
export function labelOf(key, value) {
  for (const step of QUESTION_STEPS) {
    const q = step.questions.find((item) => item.key === key)
    const option = q?.options.find((o) => o.value === value)
    if (option) return option.label
  }
  return '미정'
}
