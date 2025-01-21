import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { DraggableCore } from 'react-draggable';
import './Timeline.css';


const Timeline = ({ reactPlayerRef, currentVideoDir, thumbnailsGenerated,duration }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [thumbnails, setThumbnails] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedClip, setSelectedClip] = useState(null);
    const timelineRef = useRef(null);
    const pixelsPerSecond = 30;
    const totalWidth = duration * pixelsPerSecond;
    const majorMarkerInterval = 5; // seconds
    const minorMarkerInterval = 1; // seconds
    const leftStarting = 15; //px
    const nodeRef = React.useRef(null);
    useEffect(() => {
        const player = reactPlayerRef.current;

        if (player) { 
            const updateInterval = setInterval(() => {
                if (!isDragging) {
                    setCurrentTime(player.getCurrentTime());
                }
            }, 50);

            return () => clearInterval(updateInterval);
        }
    }, [reactPlayerRef, isDragging]);


    useEffect(() => {
        if (thumbnailsGenerated) {
            const thumbnailTimes = [];
            for (let time = 0; time <= duration; time += majorMarkerInterval) {
                thumbnailTimes.push(time);
            }
            setThumbnails(thumbnailTimes);
        }
    }, [currentVideoDir, duration, majorMarkerInterval, thumbnailsGenerated]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getThumbnailURL = useCallback((timeIndex) => {
        if (!currentVideoDir) return '';
        return `${currentVideoDir}/thumbnails/${timeIndex}.png`;
    }, [currentVideoDir]);

    

    const Thumbnail = memo(({ timeIndex, index }) => {
        const [imageError, setImageError] = useState(false);

        const handleClick = () => {
            handleTimeChange(timeIndex);
        };

        return (
            <button
                className="thumbnail-button"
                style={{
                    left: `${timeIndex * pixelsPerSecond + leftStarting}px`,
                    width: `${majorMarkerInterval * pixelsPerSecond-1}px`,
                    backgroundColor: imageError ? '#cccccc' : 'transparent',
                    backgroundImage: !imageError ? `url(${getThumbnailURL(timeIndex)})` : 'none',
                }}
                onClick={handleClick}
            >
                {imageError && <span>Thumbnail {index + 1}</span>}
            </button>
        );
    });

    const handleTimeChange = (newTime) => {
        if (reactPlayerRef.current) {
            reactPlayerRef.current.seekTo(newTime, "seconds");
        }
        setCurrentTime(newTime);
    };

    const handleDrag = (e, data) => {
        if (timelineRef.current) {
            const newTime = Math.max(0, Math.min(duration, (data.x - leftStarting) / pixelsPerSecond));
            handleTimeChange(newTime);
        }
    };

    const startClipSelection = (e) => {
        const rect = timelineRef.current.getBoundingClientRect();
        const startTime = Math.max(0, (e.clientX - rect.left - leftStarting) / pixelsPerSecond);
        setSelectedClip({ start: startTime, end: startTime });
    };

    const handleClipHandleDrag = useCallback((e, data, isStart) => {
        if (timelineRef.current && selectedClip) {
            const newTime = Math.max(0, Math.min(duration, (data.x - leftStarting) / pixelsPerSecond));
            setSelectedClip(prev => ({
                start: isStart ? Math.min(newTime, prev.end) : prev.start,
                end: isStart ? prev.end : Math.max(newTime, prev.start)
            }));
        }
    }, [selectedClip, duration]);

    return (
        <div className="timeline-container" ref={timelineRef}>
             <div
                className="timeline-marker-wrapper"
                style={{ width: `${totalWidth + 2 * leftStarting}px` }}
            >
                {Array.from({ length: Math.ceil(duration / minorMarkerInterval) + 1 }, (_, i) => {
                    const isMajorMarker = i % (majorMarkerInterval / minorMarkerInterval) === 0;
                    return (
                        <div
                            key={i}
                            className={`time-marker ${isMajorMarker ? 'major' : 'minor'}`}
                            style={{ left: `${i * minorMarkerInterval * pixelsPerSecond + leftStarting}px` }}
                        >
                            {isMajorMarker && (
                                <span className="time-marker-label">
                                    {formatTime(i * minorMarkerInterval)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="thumbnail-container">
                {thumbnails.map((timeIndex, index) => (
                    <Thumbnail key={index} timeIndex={timeIndex} index={index} />
                ))}
            </div> 
            <DraggableCore nodeRef={nodeRef} onDrag={handleDrag}>
                <div
                    ref={nodeRef}
                    className="current-time-indicator"
                    style={{
                        left: `${currentTime * pixelsPerSecond + leftStarting}px`,
                        cursor: 'ew-resize'
                    }}
                >
                    <div ref={nodeRef} className="time-indicator-handle"></div>
                </div>
            </DraggableCore>
            {/* <div ref={nodeRef} className="clip-selection-area" onMouseDown={startClipSelection}>
                {selectedClip && (
                    <div ref={nodeRef} className="selected-clip"
                        style={{
                            left: `${selectedClip.start * pixelsPerSecond + leftStarting}px`,
                            width: `${(selectedClip.end - selectedClip.start) * pixelsPerSecond}px`
                        }}
                    >
                        <DraggableCore nodeRef={nodeRef} onDrag={(e, data) => handleClipHandleDrag(e, data, true)}>
                            <div className="clip-handle start-handle"></div>
                        </DraggableCore>
                        <DraggableCore nodeRef={nodeRef} onDrag={(e, data) => handleClipHandleDrag(e, data, false)}>
                            <div className="clip-handle end-handle"></div>
                        </DraggableCore>
                    </div>
                )}
            </div> */}
        </div>
    );
};

export default Timeline;
