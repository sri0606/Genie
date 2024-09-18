import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import './Project.css';
import Chatbox from './Chatbox';
import Timeline from './Timeline';

export default function ProjectPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const playerRef = useRef(null);
  const [projectURL, setProjectURL] = useState('');
  const generateThumbnails = async (videoPath) => {
    try {
      const result = await window.api.generateThumbnails(videoPath);
      console.log(result); // Handle success
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    }
  };


  async function handleUpload() {
    try {
      const filePath = await window.api.openFileDialog();
      console.log('Selected file path:', filePath);

      if (filePath) {
        const appDir = await window.api.getAppDir();  
        const fileName = window.api.pathBasename(filePath);
        const fileBaseName = window.api.pathWithoutExtension(fileName);

        const workingDir = window.api.pathJoin(appDir, fileBaseName);
        await window.api.ensureDirExists(workingDir);

        const destinationPath = window.api.pathJoin(workingDir, fileName);

        await window.api.copyFile(filePath, destinationPath);
        console.log('File copied to:', destinationPath);

        setProjectURL(`http://localhost:3000/media/${fileBaseName}`);
        setVideoUrl(`http://localhost:3000/media/${fileBaseName}/${fileName}`);

        window.api.sendVideoPath(`http://localhost:3000/media/${fileBaseName}/${fileName}`);
        generateThumbnails(destinationPath);

      }
    } catch (err) {
      console.error('Error handling the file:', err);
    }
  }

  return (
    <div className="project-page">
      <div className="menu-bar">
        <button onClick={handleUpload}>Upload Video</button>
      </div>
      <div className='main-content-layout'>
        <div className="top-row">
          {videoUrl ? (
            <div className="video-viewport">
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                controls={true}
                width="100%"
                height="100%"
              />
            </div>
          ) : (
            <div className="no-video">No video selected. Please upload a video.</div>
          )}
          <Chatbox />
        </div>

        <div className="bottom-row">
          <Timeline reactPlayerRef={playerRef} projectURL={projectURL} />
        </div>
      </div>
    </div>
  );
}
