// 숫자 입력칸과 '미정' 체크박스를 함께 보여 주고 미정 선택 시 값을 null로 저장한다.
import { useAnswers } from '../state/answersContext.js'

export default function NumberQuestion({ question }) {
  const { answers, setAnswer } = useAnswers()
  const undecided = question.fields.every((f) => answers[f.key] === null)

  function toggleUndecided(checked) {
    for (const field of question.fields) setAnswer(field.key, checked ? null : '')
  }

  return (
    <div className="number-row">
      <div className="number-fields">
        {question.fields.map((field) => (
          <label key={field.key} className="number-field">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={answers[field.key] ?? ''}
              disabled={undecided}
              onChange={(e) => setAnswer(field.key, e.target.value)}
            />
            <span className="unit">{field.unit}</span>
          </label>
        ))}
      </div>
      <label className="undecided">
        <input type="checkbox" checked={undecided} onChange={(e) => toggleUndecided(e.target.checked)} />
        미정
      </label>
    </div>
  )
}