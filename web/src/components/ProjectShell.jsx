 
import { useProjectShell } from "../context/ProjectShellContext";
import ProjectSidebar from "./ProjectSidebar";

export default function ProjectShell({ children, projectRole }) {
  const { expanded } = useProjectShell();

  return (
    <div
      className={[
        "relative h-full w-full overflow-hidden bg-[#f5f7fa]",
        "md:grid md:transition-[grid-template-columns] md:duration-200",
        expanded
          ? "md:grid-cols-[320px_minmax(0,1fr)]"
          : "md:grid-cols-[56px_minmax(0,1fr)]",
      ].join(" ")}
    >
      <ProjectSidebar projectRole={projectRole} />

      <main className="relative h-full min-h-0 min-w-0 overflow-hidden pb-14 md:pb-0">
        {children}
      </main>
    </div>
  );
}