

import "./Button.css";

export default function Button({
  // as: Comp = "button",
  children,
  className = "",
  variant = "default",
  size = "sm",
  type,
  ...props
}) {
  // const isButton = Comp === "button";
  // const resolvedType = isButton ? (type ?? "button") : undefined;

  return (
    <button
      className={`button button--${variant} button--${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

// USAGE
{/* <Button>Default</Button>

<Button variant="primary">
  Primary
</Button>

<Button variant="ghost" size="lg">
  Large Ghost
</Button>

<Button as="a" href="/docs">
  Link Button
</Button> */}