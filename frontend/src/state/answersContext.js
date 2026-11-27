// 여러 화면에서 입력한 답변 상태를 함께 공유하기 위한 컨텍스트를 정의한다.
import { createContext, useContext } from 'react'

export const AnswersContext = createContext(null)

export function useAnswers() {
  return useContext(AnswersContext)
}