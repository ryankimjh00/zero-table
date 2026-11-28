// 진행 단계 표시. 지난 단계는 체크, 지금 단계는 강조한다.
import { SIMPLE_STEPS } from '../constants/flow.js'

// current는 1부터 센다.
export default function FlowStepper({ steps = SIMPLE_STEPS, current }) {
  return (
    <ol className="stepper">
      {steps.map((label, index) => {
        const number = index + 1
        const state = number < current ? 'done' : number === current ? 'current' : 'todo'
        return (
          <li key={label} className={`step ${state}`}>
            <span className="step-dot">{state === 'done' ? '✓' : number}</span>
            <span className="step-label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
