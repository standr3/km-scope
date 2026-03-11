import DataTable from "../../../components/ui/DataTable/DataTable";
import Badge from "../../../components/ui/Badge/Badge";
import Button from "../../../components/ui/Button/Button";

export default function TeacherRequestsTable({
  requests = [],
  onGrant,
  className = "",
}) {
  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button onClick={() => onGrant?.(r.request_id)}>
          Accept
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      className={className}
      columns={columns}
      data={requests}
      rowKey={(r) => r.request_id}
      emptyText="No pending requests"
    />
  );
}