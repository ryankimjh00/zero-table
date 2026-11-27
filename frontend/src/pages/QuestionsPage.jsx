// 추가 질문 단계별 입력 화면과 진행 상태를 보여 준다.
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAnswers } from '../state/answersContext.js'
import { QUESTION_STEPS, TOTAL_QUESTIONS } from '../constants/questions.js'
import ChoiceChips from '../components/ChoiceChips.jsx'
import NumberQuestion from '../components/NumberQuestion.jsx'
import SummaryBar from '../components/SummaryBar.jsx'
import FlowStepper from '../components/FlowStepper.jsx'
import { questionsPath, RESULT_OPEN_PATH, SIMPLE_RESULT_PATH } from '../constants/routes.js'

export default function QuestionsPage() {
  const step = Number(useParams().step)
  const navigate = useNavigate()
  const { answers, setAnswer } = useAnswers()

  const data = QUESTION_STEPS[step - 1]
  if (!data) return <Navigate to={questionsPath(1)} replace />

  const totalSteps = QUESTION_STEPS.length
  // 앞 단계까지의 질문 수를 더해 이번 단계 질문 번호를 이어서 매긴다.
  const firstNumber = QUESTION_STEPS.slice(0, step - 1).reduce((sum, s) => sum + s.questions.length, 0) + 1
  const lastNumber = firstNumber + data.questions.length - 1
  const isLast = step === totalSteps

  function goNext() {
    navigate(isLast ? RESULT_OPEN_PATH : questionsPath(step + 1))
  }
  function goPrev() {
    navigate(step === 1 ? SIMPLE_RESULT_PATH : questionsPath(step - 1))
  }

  return (
    <div className="page gray">
      <FlowStepper current={3} />
      <span className="pill green">추가 질문 · {step}/{totalSteps}</span>
      <h1 className="title">{data.title}</h1>
      <p className="lead">{data.description}</p>
      <SummaryBar />

      <div className="progress-card">
        <strong>총 {TOTAL_QUESTIONS}개 질문 · {totalSteps}단계 | {step} / {totalSteps} · 질문 {firstNumber}–{lastNumber} · {data.section}</strong>
        <div className="bar"><span style={{ width: `${(step / totalSteps) * 100}%` }} /></div>
      </div>

      <div className="question-card">
        {data.questions.map((q, index) => (
          <fieldset key={q.title} className="question">
            <legend>
              <span className="q-number">{String(firstNumber + index).padStart(2, '0')}</span>
              {q.title}
            </legend>
            {q.type === 'choice' ? (
              <ChoiceChips options={q.options} selected={answers[q.key]} onSelect={(v) => setAnswer(q.key, v)} />
            ) : (
              <NumberQuestion question={q} />
            )}
            {q.hint && <p className="field-hint">{q.hint}</p>}
          </fieldset>
        ))}
      </div>

      <div className="nav-buttons">
        <button type="button" className="btn ghost" onClick={goPrev}>{step === 1 ? '이전 · 요약 결과' : '이전'}</button>
        <button type="button" className="btn primary grow" onClick={goNext}>
          → {isLast ? '입력 완료하고 결과 열기' : '다음'}
        </button>
      </div>
      <p className="muted small center">답변은 단계를 넘어가도 유지돼요.</p>
    </div>
  )
}