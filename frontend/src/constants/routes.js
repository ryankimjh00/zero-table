// 화면 주소와 분석 모드를 한곳에 모은다.
import { QUESTION_STEPS } from './questions.js'

// 주소를 글자로 직접 쓰면 오타가 나도 오류 없이 첫 화면으로 가 버린다.
// 여기 이름을 가져다 쓰면 이름을 틀렸을 때 빌드에서 바로 오류가 난다.

export const START_PATH = '/'
export const INPUT_PATH = '/input'
export const ANALYZING_PATH = '/analyzing'
export const SIMPLE_RESULT_PATH = '/result'
export const QUESTIONS_PATH = '/questions/:step'
export const RESULT_OPEN_PATH = '/open'
export const REPORT_PATH = '/report'
export const ABOUT_PATH = '/about'

// 분석 모드: 간단 분석은 기본 입력만, 상세 분석은 추가 질문 답변까지 보낸다.
export const SIMPLE_MODE = 'simple'
export const DETAIL_MODE = 'detail'

export const LAST_QUESTION_STEP = QUESTION_STEPS.length

// 값이 들어가는 주소는 함수로 만든다.
export const inputPath = (mode) => `${INPUT_PATH}?mode=${mode}`
export const analyzingPath = (mode) => `${ANALYZING_PATH}?mode=${mode}`
export const questionsPath = (step) => QUESTIONS_PATH.replace(':step', step)

// 주소의 ?mode= 값이 상세 분석인지 확인한다.
export function isDetailMode(searchParams) {
  return searchParams.get('mode') === DETAIL_MODE
}
