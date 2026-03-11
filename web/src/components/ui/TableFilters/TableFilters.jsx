// src/components/ui/TableFilters/TableFilters.jsx
import "./table-filters.css";

export default function TableFilters({ children, className = "", ...props }) {
  return (
    <div
      data-slot="table-filters"
      role="radiogroup"
      className={`table-filters ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}