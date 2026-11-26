import { useState } from 'react'
import { AnswersContext } from './answersContext.js'
import { DEFAULT_ANSWERS, NUMBER_FIELDS } from '../constants/questions.js'
import { QUARTER } from '../api.js'

// 기본 입력 예시값: 시안의 "수제버거 · 서울 성수동 · 포장"에 가장 가까운 실제 코드
const DEFAULT_BASE = {
  food: '수제버거',
  industryCode: 'CS100006',
  district: { code: '3120052', name: '성수역', type: '발달상권', gu: '성동구', dong: '성수2가3동' },
  salesModes: ['포장'],
}

export default function AnswersProvider({ children }) {
  const [base, setBase] = useState(DEFAULT_BASE) // 음식·동네·판매 방식
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS) // 추가 질문 응답
  const [simpleResult, setSimpleResult] = useState(null) // 간단 분석 결과
  const [detailResult, setDetailResult] = useState(null) // 상세 분석 결과

  function setAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const value = {
    base, setBase, answers, setAnswer,
    simpleResult, setSimpleResult, detailResult, setDetailResult,
    baseBody: () => toBaseBody(base),
    detailBody: () => toDetailBody(base, answers),
  }
  return <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>
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
  return {
    ...toBaseBody(base),
    customer: { type: answers.customerType, ageGroup: answers.ageGroup, visitPurpose: answers.visitPurpose },
    schedule: { businessDays: answers.businessDays, mainTime: answers.mainTime },
    demand: { targetMonthlySales: n.targetMonthlySales,monthlyOperatingDays: n.monthlyOperatingDays,
      expectedDailyTeams: n.expectedDailyTeams, },
    strategy: {
      menuPrice: n.menuPrice, areaPyeong: n.areaPyeong, seatCount: n.seatCount, tableCount: n.tableCount,
      dailyTurns: n.dailyTurns, startupCapital: n.startupCapital, monthlyCapital: n.monthlyCapital,
    },
    readiness: { experience: answers.experience, participation: answers.participation },
  }
}
