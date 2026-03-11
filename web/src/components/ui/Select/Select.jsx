import { useState, useRef, useEffect } from "react";
import "./select.css";
import { ChevronDown } from "lucide-react";


export default function Select({
  children,
  value = "",
  onChange,
  className = "",
}) {

  console.log("children", children[0].props.children)

  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!showOptions) return;

    const onPointerDown = (e) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setShowOptions(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowOptions(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showOptions]);

  return (
    <div className="select-wrapper" ref={wrapperRef}>
      {showOptions && <div className="select-options" >
        {children.map((option) => (

          <button key={option.key} onClick={() => {
            setShowOptions(false);
            onChange(option.props.children);
          }}>
            {option.props.children}
          </button>
        ))}
      </div>}
      <button className={`select-btn ${className}`.trim()} onClick={setShowOptions}>
        <span>
          {value}
        </span>

        <ChevronDown className="icon-chevron" />
      </button>
    </div>
  )
}