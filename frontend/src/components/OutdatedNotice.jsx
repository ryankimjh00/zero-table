// 분석한 뒤 입력이 바뀌었으면 결과가 지금 입력과 맞지 않으니 다시 분석하라고 알린다.
import { Link } from 'react-router-dom'

export default function OutdatedNotice({ analyzedInput, currentInput, retryTo }) {
  if (JSON.stringify(analyzedInput) === JSON.stringify(currentInput)) return null

  return (
    <div className="panel warn">
      <div className="row-between wrap">
        <div>
          <h3>답변이 바뀌어 다시 분석해야 해요</h3>
          <p className="small">아래 결과는 바꾸기 전 답변으로 분석한 내용이에요.</p>
        </div>
        <Link className="btn primary" to={retryTo}>다시 분석하기</Link>
      </div>
    </div>
  )
}
