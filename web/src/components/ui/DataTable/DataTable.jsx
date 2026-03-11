import './data-table.css';
export default function DataTable({
  columns,
  data,
  rowKey,
  className = "",
  emptyText = "No results.",
}) {
  const hasRows = Array.isArray(data) && data.length > 0;

  return (
    <div className={`table-wrapper ${className}`.trim()}>
      <div className="table-container">
        <table>
          <thead className="table-header">
            <tr className="table-row">
              {columns.map((col) => (
                <th key={col.key} className={`table-head ${col.thClassName ?? ""}`.trim()}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {hasRows ? (
              data.map((row, index) => (
                <tr className="table-row" key={rowKey ? rowKey(row) : index}>
                  {columns.map((col) => (
                    col.key === "classes_count" || col.key === "project_count" ? (
                      <td key={col.key} className={`table-cell ${col.tdClassName ?? ""}`.trim()}>
                        -
                      </td>
                    ) : (
                      <td key={col.key} className={`table-cell ${col.tdClassName ?? ""}`.trim()}>
                        {typeof col.cell === "function" ? col.cell(row) : row[col.key]}
                      </td>
                    )))}
                </tr>
              ))
            ) : (
              <tr className="table-row">
                <td className="table-cell" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}