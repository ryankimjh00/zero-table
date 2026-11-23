import { useAnswers } from '../state/answersContext.js'

// 숫자 입력 질문. 칸이 1~2개이고 오른쪽에 '미정' 체크박스가 있다.
// 미정이면 값을 null로 저장하고 입력칸을 잠근다.
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
