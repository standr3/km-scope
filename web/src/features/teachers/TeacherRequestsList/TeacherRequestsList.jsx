import ScrollArea from "../../../components/ui/ScrollArea/ScrollArea";
import Item from "../../../components/ui/Item/Item";
import "./teacher-requests-list.css";

import { Check } from 'lucide-react';

export default function TeacherRequestsList({
  requests = [],
  onGrant,
  title = "Pending requests",
  className = "",
}) {

  // console.log(requests)
  return (
    <ScrollArea title={title} className={`teacher-requests-list ${className}`.trim()} separators = { true} height="100%" >
    {/* <div className="teacher-requests-list"> */ }
  {
    requests.length > 0 ? (
      requests.map((teacher) => (
        <Item
          key={teacher.request_id}
          title={teacher.name}
          description={teacher.email}
          actionLabel={<Check />}
          variant="ghost"
          size="xs"
          onAction={() => onGrant?.(teacher.request_id)}
        />

      ))
    ) : (
      <div className="teacher-requests-list__empty">
        No pending requests
      </div>
    )
  }
  {/* </div> */ }
    </ScrollArea >
  );
}