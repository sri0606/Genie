import React, { useState, useEffect } from 'react';

export default function Homepage() {
  const [projects, setProjects] = useState([]);
  const [appDataDirectory, setAppDataDirectory] = useState('');

  // useEffect to fetch the app data directory
  useEffect(() => {
    const fetchAppDataDirectory = async () => {
      const directory = await window.api.getProjectResourcesDir();
      setAppDataDirectory(directory);
    };

    fetchAppDataDirectory();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectList = await window.api.getProjects();
        setProjects(projectList);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [appDataDirectory]);

  const createNewProject = async () => {
    const projectId = await window.api.createNewProjectId();
    console.log(projectId);
    const projectDir = window.api.pathJoin(appDataDirectory, projectId);
    window.api.ensureDirExists(projectDir);

    // Update state to include the new project
    setProjects([...projects, { id: projectId, name: `Project ${projectId}` }]);
    
    window.api.openProject(projectId);
  };

  const openProject = (projectId) => {
    window.api.openProject(projectId);
  };

  return (
    <div>
      <h1>Homepage</h1>
      <button onClick={createNewProject}>New Project</button>
      <h2>Past Projects</h2>
      <ul>
        {projects.map(project => (
          <li key={project.id}>
            <button onClick={() => openProject(project.id)}>{project.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
