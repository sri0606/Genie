import React, { useState, useEffect, useCallback, useRef,memo } from 'react';
import VideoControls from './VideoControls';
import Chatbox from './Chatbox';
import './ProjectPage.css';

const Thumbnail = memo(({ video, onSelect, isSelected }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleClick = useCallback(() => {
    onSelect(video);
  }, [video, onSelect]);

  return (
    <button
      className={`video-thumbnail-button ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      title={video.name}
    >
      {!imageError ? (
        <img
          src={`${video.dirURL}/thumbnails/0.png`}
          alt={`Thumbnail for ${video.name}`}
          onError={handleImageError}
        />
      ) : (
        <div className="thumbnail-placeholder">
          <span className="video-icon">🎥</span>
        </div>
      )}
    </button>
  );
});

const VideoList = ({ videos, onVideoSelect, currentVideo }) => {
  return (
    <div className="video-list-container">
      <div className="video-list">
        {videos.length > 0 ? (
          videos.map((video) => (
            <Thumbnail
              key={video.id || video.url}
              video={video}
              onSelect={onVideoSelect}
              isSelected={currentVideo && currentVideo.id === video.id}
            />
          ))
        ) : (
          <div className="no-videos">No videos available</div>
        )}
      </div>
    </div>
  );
};

// Helper function to format duration (assuming duration is in seconds)
const formatDuration = (duration) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};


export default function ProjectPage({ projectId }) {
  const projectRef = useRef({
    videos: [],
    projectURL: null,
    projectDataDir: null,
  });
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isThumbnailsGenerated, setIsThumbnailsGenerated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const chatBoxRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const loadVideosForProject = async (projectId) => {
      const loadedProject = await window.api.loadProject(projectId);

      const projectsResourcesDir = await window.api.getProjectResourcesDir();
      const projectsResourcesEndpoint = await window.api.getProjectResourcesEndpoint();
      const url = window.api.pathJoinURL(projectsResourcesEndpoint, projectId);
      const dataDir = window.api.pathJoin(projectsResourcesDir, projectId);

      if (loadedProject) {
        projectRef.current = {
          ...loadedProject,
          projectURL: url,
          projectDataDir: dataDir,
          videos: loadedProject.videos || [],
        };
        if (projectRef.current.videos.length > 0) {
          setCurrentVideo({ ...projectRef.current.videos[0] });
          setIsThumbnailsGenerated(true);
        }
        chatBoxRef.current.setMessages(loadedProject.chatMessages);
      }
    };

    loadVideosForProject(projectId);
  }, [projectId]);

  const generateThumbnails = useCallback(async (videoPath) => {
    try {
      const result = await window.api.generateThumbnails(videoPath);
      setIsThumbnailsGenerated(true);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      setIsThumbnailsGenerated(false);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    try {
      setIsThumbnailsGenerated(false);
      const newVideo = await window.api.handleUpload(
        projectRef.current.videos.length + 1,
        projectRef.current.projectDataDir,
        projectRef.current.projectURL
      );
      if (newVideo) {
        projectRef.current.videos.push(newVideo);
        setCurrentVideo({ ...newVideo });
        await generateThumbnails(newVideo.location);
      }
    } catch (err) {
      console.error('Error handling the file:', err);
    }
  }, [generateThumbnails]);

const handleSaveProject = async () => {
    const project = {

      id:projectId,
      name: projectId,
      projectURL: projectRef.current.projectURL,
      projectDataDir: projectRef.current.projectDataDir,
      videos: projectRef.current.videos,
      chatMessages: chatBoxRef.current.getMessages(),
    };
    console.log("Saving project data:", project);
    // Save the project to disk
    await window.api.saveProject(project);
  };


  const handleVideoSelect = useCallback((video) => {
    console.log('Video selected:', video);
    setCurrentVideo(video);
    setIsThumbnailsGenerated(true);
    setIsOpen(false);
  }, []);


  useEffect(() => {
      // Listen for the upload video menu item click from the main process
      window.api.onUploadMenuClicked(() => {
        console.log("Upload Video menu clicked!");
        handleUpload();
      });
     

    return () => {
      window.api.removeAllListeners('upload-menu-clicked');
    };
  }, [handleUpload]);

  useEffect(()=>{
     window.api.onGoToHomeClicked(() => {
        window.api.openProject(null);
      });
       return () => {
      window.api.removeAllListeners('go-to-home-page');
    };

  },[]);
  useEffect(()=>{
    window.api.onSaveProjectClicked(()=>{
      handleSaveProject();
    })
    return () => {
      window.api.removeAllListeners('save-project');
    };
  },[handleSaveProject]);

  return (
    <div className="project-page">
      <div className='main-content-layout'>
        <div className='left-column'>

          <VideoControls
            key={currentVideo ? currentVideo.url : 'no-video'}
            video={currentVideo}
            thumbnailsGenerated={isThumbnailsGenerated}
            videosList = {          <VideoList
            videos={projectRef.current.videos}
            onVideoSelect={handleVideoSelect}
            currentVideo={currentVideo}
          />}
          />
        </div>
        <div className="right-column">
          <Chatbox 
            ref={chatBoxRef}
            video={currentVideo}
            onVideoUpdate={(updatedVideo) => setCurrentVideo({ ...updatedVideo })}
          />
        </div>
      </div>
    </div>
  );
}
