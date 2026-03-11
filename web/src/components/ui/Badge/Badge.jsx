
import "./Badge.css";

export default function Badge({
  children,
  className = "",
  variant = "default", // "default" | "success" | "warning" | "danger" | "outline"
  ...props
}) {
  return (
    <span
      className={`badge badge--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}

{/* <Badge>New</Badge>

<Badge variant="success">
  <svg viewBox="0 0 24 24"><path d="..." /></svg>
  Active
</Badge>

<Badge variant="outline">Beta</Badge> */}