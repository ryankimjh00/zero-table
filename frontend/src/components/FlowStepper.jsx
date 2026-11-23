import { SIMPLE_STEPS } from '../constants/flow.js'

// 화면 아래(또는 위)의 진행 단계 표시. current는 1부터 센다.
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
