import { createContext, useContext } from 'react'

// 여러 화면이 같은 답변을 함께 쓰기 위한 공용 보관함.
// 1단계에서 고른 답이 3단계와 보고서까지 그대로 남아 있는 이유가 이것이다.
export const AnswersContext = createContext(null)

export function useAnswers() {
  return useContext(AnswersContext)
}
