import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import Timeline from './Timeline';
import './VideoControls.css';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';
import CropIcon from '@mui/icons-material/Crop';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import VerticalSplitOutlinedIcon from '@mui/icons-material/VerticalSplitOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import RedoOutlinedIcon from '@mui/icons-material/RedoOutlined';

function VideoControls({ video, thumbnailsGenerated, videosList }) {
  const playerRef = useRef(null);
  const [videoPath, setVideoPath] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cutPoints, setCutPoints] = useState([]);
  const [splitPoints, setSplitPoints] = useState([]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }

    if (video && video.current && video.current.videoPath) {
      setVideoPath(video.current.videoPath);
    } else {
      setVideoPath(null);
    }
  }, [video]);

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleCut = () => {
    setCutPoints([...cutPoints, currentTime]);
    console.log(`Cut at ${currentTime} seconds`);
    // Implement actual cutting logic here
  };

  const handleSplit = () => {
    setSplitPoints([...splitPoints, currentTime]);
    console.log(`Split at ${currentTime} seconds`);
    // Implement actual splitting logic here
  };

  const handleUndo = () => {
    // Implement undo logic here
    console.log('Undo action');
  };

  const handleRedo = () => {
    // Implement redo logic here
    console.log('Redo action');
  };
const handleCrop = () => {
    // Implement undo logic here
    console.log('crop');
  };

  const handlePan = () => {
    // Implement redo logic here
    console.log('pan action');
  };

  if (!video) {
    return <div className="no-video">No video selected. Please upload a video.</div>;
  }

  return (
    <>
        <div className="row-one">
            {videosList}
            <div className='video-viewport-container'>
                {videoPath ? (
                <div className="video-viewport">
                    <ReactPlayer
                    key={videoPath}
                    ref={playerRef}
                    url={videoPath}
                    controls={true}
                    width="100%"
                    height="100%"
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    />
                </div>
                ) : (
                <div className="no-video">No video selected. Please upload a video.</div>
                )}
            </div>
        </div>
        <div className="video-controls-btns-row">
            <button title="Cut" onClick={handleCut} className="control-button cut-button">
                <ContentCutIcon className="icon" />
                {/* Cut */}
            </button>
            <button title="Split" onClick={handleSplit} className="control-button split-button">
                <VerticalSplitOutlinedIcon className="icon" />
                {/* Split */}
            </button>
            <button title="Undo" onClick={handleUndo} className="control-button undo-button">
                <UndoOutlinedIcon className="icon" />
                {/* Undo */}
            </button>
            <button title="Redo" onClick={handleRedo} className="control-button redo-button">
                <RedoOutlinedIcon className="icon" />
                {/* Redo */}
            </button>
            <button title="Crop" onClick={handleCrop} className="control-button crop-button">
                <CropIcon className="icon" />
                {/* Crop */}
            </button>
            <button title="Pan" onClick={handlePan} className="control-button pan-button">
                <PanToolOutlinedIcon className="icon" />
                {/* Pan */}
            </button>
        </div>

      <Timeline
        reactPlayerRef={playerRef}
        currentVideoDir={video ? video.dirURL : ''}
        thumbnailsGenerated={thumbnailsGenerated}
        duration={duration}
        currentTime={currentTime}
        cutPoints={cutPoints}
        splitPoints={splitPoints}
      />
    </>
  );
}

export default VideoControls;