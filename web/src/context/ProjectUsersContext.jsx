import React, { createContext, useContext } from 'react';

const ProjectUsersContext = createContext(null);

export function ProjectUsersProvider({ value, children }) {
  return (
    <ProjectUsersContext.Provider value={value}>
      {children}
    </ProjectUsersContext.Provider>
  );
}

export function useProjectUsers() {
  const ctx = useContext(ProjectUsersContext);

  if (!ctx) {
    throw new Error('useProjectUsers must be used inside ProjectUsersProvider');
  }

  return ctx;
}