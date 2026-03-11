// src/components/ui/TablePagination/TablePagination.jsx
import "./table-pagination.css";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Button from "../Button/Button";
import Select from "../Select/Select";

export default function TablePagination({
  // selectedCount = 0,
  // totalCount = 0,

  page = 1,          // 1-based
  pageCount = 1,     // total pages (>=1)

  pageSize = 5,
  pageSizeOptions = [5, 10, 15],

  onPageChange,
  onPageSizeChange,

  className = "",
}) {
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div
      className={`table-pagination ${className}`.trim()}
    >
      {/* <div className="table-pagination__left">
        <span className="table-pagination__muted">
          Page 1 of 7
        </span>
      </div> */}


      <div className="table-pagination__size">
        <span className="table-pagination__label">Rows per page</span>


        {/* <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select> */}

        <Select
          className="table-pagination__select"
          onChange={(selected) => onPageSizeChange?.(Number(selected))}
          value={pageSize}
        >

          {pageSizeOptions.map((n) => (
            <option key={n}>
              {n}
            </option>
          ))}
        </Select>

      </div>

      <div className="table-pagination__page">
        <span className="table-pagination__label">
          Page {page} of {pageCount}
        </span>
      </div>
      <div className="table-pagination__controls" aria-label="Pagination">
        <Button
          // type="button"
          className="pager-btn"
          onClick={() => onPageChange?.(1)}
          disabled={!canPrev}
          aria-label="First page"
          size="base"
          variant="icon"
        >
          <ChevronsLeft size={16} />
        </Button>

        <Button
          // type="button"
          className="pager-btn"
          onClick={() => onPageChange?.(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
          size="base"
          variant="icon"
        >
          <ChevronLeft size={16} />
        </Button>

        <Button
          // type="button"
          className="pager-btn"
          onClick={() => onPageChange?.(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
          size="base"
          variant="icon"
        >
          <ChevronRight size={16} />
        </Button>

        <Button
          // type="button"
          className="pager-btn"
          onClick={() => onPageChange?.(pageCount)}
          disabled={!canNext}
          aria-label="Last page"
          size="base"
          variant="icon"
        >
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  );
}