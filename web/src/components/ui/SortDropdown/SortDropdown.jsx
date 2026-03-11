// src/components/ui/SortDropdown/SortDropdown.jsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "./sort-dropdown.css";

export default function SortDropdown({
  value,
  onChange,
  options = [],
  label = "Sort",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      ref={ref}
      data-slot="sort-dropdown"
      className={`sort-dropdown ${className}`.trim()}
    >
      <button
      
        className="sort-dropdown__trigger"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="sort-dropdown__label">
          {label}:{selected?.label}
        </span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div
          className="sort-dropdown__content"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              className={`sort-dropdown__item ${
                option.value === value ? "is-active" : ""
              }`}
              onClick={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}