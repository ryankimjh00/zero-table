// 모든 화면이 같이 쓰는 입력값·분석 결과 보관함. 새로고침해도 남도록 sessionStorage에도 저장한다.
import { useEffect, useState } from 'react'
import { AnswersContext } from './answersContext.js'
import { DEFAULT_ANSWERS, NUMBER_FIELDS } from '../constants/questions.js'
import { QUARTER } from '../api.js'

// 첫 화면에 미리 채워 두는 예시 입력 (성수역 · 수제버거 · 포장)
const DEFAULT_BASE = {
  food: '수제버거',
  industryCode: 'CS100006',
  district: { code: '3120052', name: '성수역', type: '발달상권', gu: '성동구', dong: '성수2가3동' },
  salesModes: ['포장'],
}

// 새로고침해도 입력과 결과가 남도록 sessionStorage에 저장한다. 탭을 닫으면 지워진다.
const STORAGE_KEY = 'zero-table'
// 저장 형식이 바뀌면 숫자를 올린다. 버전이 다른 옛 값은 버리고 기본값으로 시작한다.
const STORAGE_VERSION = 1

// 화면 답 → 서버 값. '미정'은 표에 없어서 null이 된다.
const CAN_ADJUST_HOURS_VALUES = { YES: true, NO: false }

export default function AnswersProvider({ children }) {
  const [saved] = useState(readSaved)
  const [base, setBase] = useState(saved?.base ?? DEFAULT_BASE) // 음식·동네·판매 방식
  const [answers, setAnswers] = useState(saved?.answers ?? DEFAULT_ANSWERS) // 추가 질문 응답
  const [simpleResult, setSimpleResult] = useState(saved?.simpleResult ?? null) // 간단 분석 결과
  const [detailResult, setDetailResult] = useState(saved?.detailResult ?? null) // 상세 분석 결과

  useEffect(() => {
    const data = { version: STORAGE_VERSION, base, answers, simpleResult, detailResult }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [base, answers, simpleResult, detailResult])

  function setAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  // "새 아이디어 분석": 입력과 결과를 모두 처음 상태로 되돌린다.
  function resetAll() {
    setBase(DEFAULT_BASE)
    setAnswers(DEFAULT_ANSWERS)
    setSimpleResult(null)
    setDetailResult(null)
  }

  const value = {
    base, setBase, answers, setAnswer,
    simpleResult, setSimpleResult, detailResult, setDetailResult,
    resetAll,
    baseBody: () => toBaseBody(base),
    detailBody: () => toDetailBody(base, answers),
  }
  return <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>
}

// 저장된 값이 없거나, 버전이 다르거나, 읽다가 깨지면 null을 돌려 기본값으로 시작하게 한다.
function readSaved() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    return saved?.version === STORAGE_VERSION ? saved : null
  } catch {
    return null
  }
}

// 서버가 반드시 요구하는 세 값. 판매 방식은 API에 없는 항목이라 보내지 않는다.
function toBaseBody(base) {
  return { quarter: QUARTER, districtCode: base.district?.code, industryCode: base.industryCode }
}

// 화면 답변 → 서버 요청 JSON. 화면 단위(만 원)를 서버 단위(원)로 바꾸고 '미정'은 null로 보낸다.
function toDetailBody(base, answers) {
  const n = {}
  for (const field of NUMBER_FIELDS) {
    const raw = answers[field.key]
    if (raw === null || raw === '') {
      n[field.key] = null
      continue
    }
    const value = Number(raw) * (field.multiplier ?? 1)
    n[field.key] = field.integer ? Math.round(value) : value
  }
  const canAdjustHours = CAN_ADJUST_HOURS_VALUES[answers.canAdjustHours] ?? null

  return {
    ...toBaseBody(base),
    customer: { type: answers.customerType, ageGroup: answers.ageGroup, visitPurpose: answers.visitPurpose },
    schedule: { businessDays: answers.businessDays, mainTime: answers.mainTime, canAdjustHours },
    demand: {
      targetMonthlySales: n.targetMonthlySales,
      monthlyOperatingDays: n.monthlyOperatingDays,
      expectedDailyTeams: n.expectedDailyTeams,
    },
    strategy: {
      menuPrice: n.menuPrice, areaPyeong: n.areaPyeong, seatCount: n.seatCount, tableCount: n.tableCount,
      dailyTurns: n.dailyTurns, startupCapital: n.startupCapital, monthlyCapital: n.monthlyCapital,
    },
    readiness: { experience: answers.experience, participation: answers.participation },
  }
}