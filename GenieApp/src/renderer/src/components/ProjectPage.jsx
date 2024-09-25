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
    <div className='video-viewport-container'>
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
      </div>
      <Timeline
        reactPlayerRef={playerRef}
        currentVideoDir={video ? video.dirURL : ''}
        thumbnailsGenerated={thumbnailsGenerated}
      />
    </>
  );
}
export default function ProjectPage({ projectId, projectURL, projectDataDir }) {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isThumbnailsGenerated, setIsThumbnailsGenerated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  useEffect(() => {
    const loadVideosForProject = async (projectId) => {
      const loadedVideos = await window.api.getVideosInProject(projectId);
      console.log('Loaded videos:', loadedVideos);
      setVideos(loadedVideos);

      if (loadedVideos.length > 0) {
        setCurrentVideo(loadedVideos[0]);
        setIsThumbnailsGenerated(true);
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
      const { newVideo, destinationPath } = await window.api.handleUpload(projectDataDir, projectURL);
      if (newVideo) {
        setVideos(prevVideos => [...prevVideos, newVideo]);
        setCurrentVideo({...newVideo});

        // Generate thumbnails after upload
        await generateThumbnails(destinationPath);
      }
    } catch (err) {
      console.error('Error handling the file:', err);
    }
  }, [projectDataDir, projectURL, generateThumbnails]);


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
  }, [videos]);

  useEffect(()=>{
     window.api.onGoToHomeClicked(() => {
        window.api.openProject(null);
      });
       return () => {
      window.api.removeAllListeners('go-to-home-page');
    };
  },[]);

  return (
    <div className="project-page">

      
      <div className='main-content-layout'>
        <div className='left-column'>
          <div className="dropdown">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              Select Video
            </button>
            {isOpen && (
              <ul className="dropdown-menu">
                {videos && videos.length > 0 ? (
                  videos.map((video) => (
                    <li key={video.url}>
                      <button onClick={() => handleVideoSelect(video)}>
                        {video.name}
                      </button>
                    </li>
                  ))
                ) : (
                  <li>No videos available</li>
                )}
              </ul>
            )}
          </div>

         <VideoControls
            key={currentVideo ? currentVideo.url : 'no-video'}
            video={currentVideo}
            thumbnailsGenerated={isThumbnailsGenerated}
          /> 

        </div>
        <div className="right-column">
          <Chatbox 
            video={currentVideo} />
        </div>
      </div>
    </div>
  );
}

