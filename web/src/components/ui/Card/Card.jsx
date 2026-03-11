export function Card({ children, className = "", ...props }) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`card-header ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h3 className={`card-title ${className}`.trim()} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p className={`card-description ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`card-content ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

/* Optional layout wrappers you already have in CSS */
export function CardWrapper({ children, className = "", ...props }) {
  return (
    <div className={`card-wrapper ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardContainer({ children, className = "", ...props }) {
  return (
    <div className={`card-container ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}