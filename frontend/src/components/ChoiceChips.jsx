// 선택형 버튼 묶음. 골라진 값과 같은 버튼만 파랗게 칠한다.
export default function ChoiceChips({ options, selected, onSelect, radio = true }) {
  return (
    <div className="chips">
      {options.map((option) => {
        const value = option.value ?? option
        const label = option.label ?? option
        const isSelected = value === selected
        return (
          <button
            key={value}
            type="button"
            className={isSelected ? 'chip selected' : 'chip'}
            aria-pressed={isSelected}
            onClick={() => onSelect(value)}
          >
            {radio && <span className="radio" aria-hidden="true" />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
