import "./page-section.css";
export default function PageSection({ children, className = "" }) {
  return <div className={`tabpanel ${className}`.trim()}>{children}</div>;
}