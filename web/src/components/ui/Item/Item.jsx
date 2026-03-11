import Button from "../../../components/ui/Button/Button";
import "./Item.css";
export default function Item({
  title,
  description,
  actions, // optional: custom actions slot (ReactNode)
  onAction, // optional: convenience handler for default button
  actionLabel = "Grant",
  className = "",
  size = "default",   // "xs" | "default"
  variant = "outline", // "outline" | "ghost"
  ...props
}) {
  return (
    <div
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={`item ${className}`.trim()}
      tabIndex={0}
      {...props}
    >
      <div data-slot="item-content" className="item__content">
        <span data-slot="item-title" className="item__title">
          {title}
        </span>

        {description ? (
          <span data-slot="item-description" className="item__description">
            {description}
          </span>
        ) : null}
      </div>

      <div data-slot="item-actions" className="item__actions">
        {actions ?? (
          <Button size="xs" variant="icon" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}