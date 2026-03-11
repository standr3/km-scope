// src/components/ui/FilterChipRadio/FilterChipRadio.jsx
import "./filter-chip-radio.css";

export default function FilterChipRadio({
  name,
  value,
  checked,
  onChange,
  children,
  className = "",
  disabled = false,
}) {
  const id = `${name}-${value}`;

  return (
    <div data-slot="filter-chip-radio" className={`filter-chip-radio ${className}`.trim()}>
      <input
        data-slot="filter-chip-radio-input"
        className="filter-chip-radio__input"
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      />
      <label
        data-slot="filter-chip-radio-label"
        className="filter-chip-radio__label"
        htmlFor={id}
      >
        {children}
      </label>
    </div>
  );
}