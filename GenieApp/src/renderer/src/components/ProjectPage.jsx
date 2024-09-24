import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactPlayer from 'react-player';
import Timeline from './Timeline';
import Chatbox from './Chatbox';
import './ProjectPage.css';

function VideoControls({ video, thumbnailsGenerated }) {
  const playerRef = useRef(null);

  useEffect(() => {
    // Reset player when video changes
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  }, [video]);

  if (!video) {
    return <div className="no-video">No video selected. Please upload a video.</div>;
  }

  return (
    <>
     {video ? (
        <div className="video-viewport">
          <ReactPlayer
            key={video.url}
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

  useEffect(() => {
    const loadVideosForProject = async (projectId) => {
      const loadedVideos = await window.api.getVideosInProject(projectId);
      console.log('Loaded videos:', loadedVideos);
      const normalizedVideos = loadedVideos.map(video => ({
        ...video,
        url: video.url,
        dirLocation: video.dirLocation
      }));
      setVideos(normalizedVideos);
      if (normalizedVideos.length > 0) {
        setCurrentVideo(normalizedVideos[0]);
        setThumbnailsGenerated(true);
      }
    };

    loadVideosForProject(projectId);
  }, [projectId]);

  const generateThumbnails = useCallback(async (videoPath) => {
    try {
      const result = await window.api.generateThumbnails(videoPath);
      setThumbnailsGenerated(true);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      setThumbnailsGenerated(false);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    try {
      setIsLoading(true);
      setThumbnailsGenerated(false);
      const { newVideo, destinationPath } = await window.api.handleUpload(projectDataDir, projectURL);
      if (newVideo) {
        const normalizedNewVideo = {
          ...newVideo,
          url: newVideo.url,
          dirLocation: newVideo.dirLocation
        };
        setVideos(prevVideos => [...prevVideos, normalizedNewVideo]);
        setCurrentVideo({...normalizedNewVideo});
        setIsLoading(false);

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
  }, []);

  const onBack = useCallback(() => {
    window.api.openProject(null);
  }, []);

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
              <li key={video.url}>
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
            key={currentVideo ? currentVideo.url : 'no-video'}
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

