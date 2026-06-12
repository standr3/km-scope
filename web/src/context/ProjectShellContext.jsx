// context/ProjectShellContext.jsx
import { createContext, useCallback, useContext, useMemo, useState, useRef } from "react";

const ProjectShellContext = createContext(null);

export function ProjectShellProvider({ children }) {
  const [expanded, setExpanded] = useState(false);
  // const [activePanel, setActivePanel] = useState(null);
  // const [eventsPanel, setEventsPanel] = useState(null);
  const [eventsRoot, setEventsRoot] = useState(null);
  const [scoringRoot, setScoringRoot] = useState(null);
  //  const [projectName, setProjectName] = useState("");

  const actionsRef = useRef({
    addNode: null,
    clearProjectState: null,
    scoreSession: null,
  });

  const registerActions = useCallback((nextActions) => {
    actionsRef.current = nextActions;
  }, []);

  const value = useMemo(() => {
    return {
      // eventsPanel,
      // setEventsPanel,


      expanded,
      setExpanded,
      // activePanel,
      // setActivePanel,
      actionsRef,
      registerActions,
      eventsRoot,
      setEventsRoot,
      scoringRoot,
      setScoringRoot,
    };
  }, [eventsRoot, scoringRoot, expanded, registerActions]);
  // }, [expanded, activePanel, actions, registerActions]);

  return (
    <ProjectShellContext.Provider value={value}>
      {children}
    </ProjectShellContext.Provider>
  );
}

export function useProjectShell() {
  const context = useContext(ProjectShellContext);

  if (!context) {
    throw new Error("useProjectShell must be used inside ProjectShellProvider");
  }

  return context;
}