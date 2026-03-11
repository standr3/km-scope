import "./scroll-area.css";

export default function ScrollArea({
  title,
  children,
  className = "",
  height = "18rem",
  separators = false,
  ...props
}) {
  const items = Array.isArray(children) ? children : [children];

  return (
    <div
      dir="ltr"
      data-slot="scroll-area"
      className={`scroll-area ${className}`.trim()}
      style={{ height, ...props.style }}
      {...props}
    >
      <div
        data-slot="scroll-area-viewport"
        className="scroll-area__viewport"
        tabIndex={0}
      >
        {title ? (
          <div className="scroll-area__header">
            <h4 className="scroll-area__title">{title}</h4>
          </div>
        ) : null}

        <div className="scroll-area__inner">
          {separators
            ? items.map((child, index) => (
                <div key={index} className="scroll-area__item">
                  {child}
                  {index < items.length - 1 && (
                    <div
                      data-slot="separator"
                      className="scroll-area__separator"
                      role="none"
                    />
                  )}
                </div>
              ))
            : children}
        </div>
      </div>
    </div>
  );
}