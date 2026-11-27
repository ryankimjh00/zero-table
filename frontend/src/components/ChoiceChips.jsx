// 단일 또는 복수 선택이 가능한 칩 버튼 묶음을 보여 준다.
export default function ChoiceChips({ options, selected, onSelect, radio = true }) {
  const selectedValues = Array.isArray(selected) ? selected : [selected]
  return (
    <div className="chips">
      {options.map((option) => {
        const value = option.value ?? option
        const label = option.label ?? option
        const isSelected = selectedValues.includes(value)
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