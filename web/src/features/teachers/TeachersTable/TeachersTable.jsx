import DataTable from "../../../components/ui/DataTable/DataTable";
import Badge from "../../../components/ui/Badge/Badge";
import Button from "../../../components/ui/Button/Button";
import { CircleCheck } from 'lucide-react';



export default function TeachersTable({
  className = "",
  // teachers = [],          // accepted teachers
  // pending = [],           // pending requests (optional)
  onRevoke,
  onGrant,
  PendingIcon,
  GrantedIcon,
  // page = 1,
  // pageSize = 5,
  // pageCount=1,
  rows

}) {

  

  // const rows = [
  //   ...pending.map((r) => ({ ...r, __status: "pending", __key: `p:${r.request_id}` })),
  //   ...teachers.map((t) => ({ ...t, __status: "granted", __key: `g:${t.membership_id}` })),
  // ].slice(page-1,pageSize-1);


  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.__status === "pending" ? (
          <Badge variant="default">
            {PendingIcon ? <PendingIcon /> : null}
            Pending
          </Badge>
        ) : (
          <Badge variant="success">
            {GrantedIcon ? <GrantedIcon /> : null}
            Granted
          </Badge>
        ),
    },
    { key: "classes_count", header:"Classes"},
    { key: "project_count", header:"Projects"},
    {
      key: "actions",
      header: "",
      cell: (row) =>
        row.__status === "pending" ? (
          <Button onClick={() => onGrant?.(row.request_id)}>
            Accept
          </Button>
        ) : (
          <Button onClick={() => onRevoke?.(row.membership_id)}>
            Revoke
          </Button>
        ),
    },
  ];

  return (
    <DataTable
      className={className}
      columns={columns}
      data={rows}
      rowKey={(row) => row.__key}
      emptyText="No teachers."
    />
  );
}