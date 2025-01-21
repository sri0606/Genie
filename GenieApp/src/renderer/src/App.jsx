import React, { useState, useEffect } from 'react';
import Homepage from "./components/HomePage";
import ProjectPage from './components/ProjectPage';

export default function App() {
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectsResourcesDir, setProjectsResourcesDir] = useState('');
  const [projectsResourcesEndpoint, setProjectsResourcesEndpoint] = useState('');

  // Fetch resources directory and endpoint when the app mounts
  useEffect(() => {
    const fetchAppData = async () => {
      setProjectsResourcesDir(await window.api.getProjectResourcesDir());
      setProjectsResourcesEndpoint(await window.api.getProjectResourcesEndpoint());
    };

    fetchAppData();

    // Check for projectId in the query params
    const searchParams = new URLSearchParams(window.location.search);
    const projectIdFromURL = searchParams.get('projectId');

    if (projectIdFromURL) {
      setCurrentProjectId(projectIdFromURL);
    }
  }, []);

  // Decide which component to render based on the presence of projectId
  if (currentProjectId) {
    return (
      <ProjectPage 
        key = {currentProjectId}
        projectId={currentProjectId}
      />
    );
  }

  return (
    <Homepage 
      appDataDirectory={projectsResourcesDir}
    />
  );
}

