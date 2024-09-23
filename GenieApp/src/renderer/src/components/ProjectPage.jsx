import React, { useState, useRef, useEffect , useCallback} from 'react';
import ReactPlayer from 'react-player';
import Chatbox from './Chatbox';
import Timeline from './Timeline'; 
import './ProjectPage.css';

function VideoControls({ video, thumbnailsGenerated }) {
  const playerRef = useRef(null);

  console.log('VideoControls render:', { video, thumbnailsGenerated });

  return (
    <>
      {video ? (
        <div className="video-viewport">
          <ReactPlayer
            ref={playerRef}
            url={video.url}
            controls={true}
            width="100%"
            height="100%"
          />
        </div>
      ) : (
        <div className="no-video">No video selected. Please upload a video.</div>
      )}
      <Timeline
        reactPlayerRef={playerRef}
        currentVideoDir={video ? video.dirLocation : ''}
        thumbnailsGenerated={thumbnailsGenerated}
      />
    </>
  );
}

export default function ProjectPage({ projectId, projectURL, projectDataDir }) {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailsGenerated, setThumbnailsGenerated] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    const loadVideosForProject = async (projectId) => {
      const loadedVideos = await window.api.getVideosInProject(projectId);
      console.log('Loaded videos:', loadedVideos);
      setVideos(loadedVideos);
      if (loadedVideos.length > 0) {
        setCurrentVideo(loadedVideos[0]);
        setThumbnailsGenerated(true);
      }
    };

    loadVideosForProject(projectId);
  }, [projectId]);

  const generateThumbnails = useCallback(async (videoPath) => {
    try {
      console.log('Generating thumbnails for:', videoPath);
      const result = await window.api.generateThumbnails(videoPath);
      console.log('Thumbnail generation result:', result);
      setThumbnailsGenerated(true);
      setRenderKey(prevKey => prevKey + 1);  // Force re-render
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    try {
      setIsLoading(true);
      setThumbnailsGenerated(false);
      console.log('Starting upload...');
      const { newVideo, destinationPath } = await window.api.handleUpload(projectDataDir, projectURL);
      console.log('Upload complete:', { newVideo, destinationPath });
      
      if (newVideo) {
        setVideos(prevVideos => [...prevVideos, newVideo]);
        setCurrentVideo(newVideo);
        setIsLoading(false);
        setRenderKey(prevKey => prevKey + 1);  // Force re-render

        // Generate thumbnails after upload
        await generateThumbnails(destinationPath);
      }
    } catch (err) {
      console.error('Error handling the file:', err);
      setIsLoading(false);
    }
  }, [projectDataDir, projectURL, generateThumbnails]);

  const handleVideoSelect = useCallback((video) => {
    console.log('Video selected:', video);
    setCurrentVideo(video);
    setThumbnailsGenerated(true);
    setRenderKey(prevKey => prevKey + 1);  // Force re-render
  }, []);

  const onBack = useCallback(() => {
    window.api.openProject(null);
  }, []);

  console.log('ProjectPage render:', { 
    currentVideo, 
    thumbnailsGenerated, 
    videosCount: videos.length,
    renderKey 
  });

  return (
    <div className="project-page">
      <div className="menu-bar">
        <button onClick={onBack}>Back to Home</button>
        <button onClick={handleUpload} disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Upload Video'}
        </button>
        <div className="video-list">
          <h3>Uploaded Videos</h3>
          <ul>
            {videos.map((video, index) => (
              <li key={index}>
                <button onClick={() => handleVideoSelect(video)}>
                  {video.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className='main-content-layout'>
        <div className='left-column'>
          <VideoControls
            key={`video-controls-${renderKey}`}
            video={currentVideo}
            thumbnailsGenerated={thumbnailsGenerated}
          />
        </div>
        <div className="right-column">
          <Chatbox />
        </div>
      </div>
    </div>
  );
}