import React, { useState, useEffect, useCallback,memo } from 'react';
import './Timeline.css';

const Timeline = ({ reactPlayerRef, currentVideoDir, thumbnailsGenerated }) => {
    const [duration, setDuration] = useState(60);
    const [currentTime, setCurrentTime] = useState(0);
    const [thumbnails, setThumbnails] = useState([]);
    const pixelsPerSecond = 30;
    const totalWidth = duration * pixelsPerSecond;
    const majorMarkerInterval = 5; // seconds
    const minorMarkerInterval = 1; // seconds
    const leftStarting = 15; //px

    useEffect(() => {
        const player = reactPlayerRef.current;

        if (player) { 
            const updateInterval = setInterval(() => {
                setCurrentTime(player.getCurrentTime());
            }, 50);

            // Clear interval on component unmount
            return () => {
                clearInterval(updateInterval);
            };
        }
    }, [reactPlayerRef]);

    useEffect(() => {
        const player = reactPlayerRef.current;

        const updateDuration = () => {
        const videoDuration = player?.getDuration();
        if (videoDuration) {
            setDuration(videoDuration);
        }
        };

        if (player) {
        updateDuration();
        const internalPlayer = player.getInternalPlayer();
        
        if (internalPlayer) {
            internalPlayer.addEventListener('loadedmetadata', updateDuration);

            return () => {
            // Check if internalPlayer still exists before removing the listener
            if (internalPlayer) {
                internalPlayer.removeEventListener('loadedmetadata', updateDuration);
            }
            };
        }
        }
    }, [reactPlayerRef, currentVideoDir]);

    // Generate thumbnails when projectURL or thumbnailsGenerated changes
    useEffect(() => {
        if (thumbnailsGenerated) {
            const thumbnailTimes = [];
            for (let time = 0; time <= duration; time += majorMarkerInterval) {
                thumbnailTimes.push(time);
            }
            setThumbnails(thumbnailTimes);
        }
    }, [currentVideoDir, duration, majorMarkerInterval,thumbnailsGenerated]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getThumbnailURL = useCallback((timeIndex) => {
        if (!currentVideoDir) return '';
        return `${currentVideoDir}/thumbnails/${timeIndex}.png`;
        
    }, [currentVideoDir]);

    const handleTimeChange = (timeIndex) => {
        if (reactPlayerRef.current) {
            const fraction = timeIndex / duration;
            if (isFinite(fraction)) {
                reactPlayerRef.current.seekTo(fraction, "fraction");
            } else {
                console.error("Invalid fraction value:", fraction);
            }
        }
    };

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
                    width: `${majorMarkerInterval * pixelsPerSecond}px`,
                    backgroundColor: imageError ? '#cccccc' : 'transparent',
                    backgroundImage: !imageError ? `url(${getThumbnailURL(timeIndex)})` : 'none',
                }}
                onClick={handleClick}
            >
                {imageError && <span>Thumbnail {index + 1}</span>}
            </button>
        );
    });

    return (
        <div className="timeline-container">
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
            <div
                className="current-time-indicator"
                style={{
                    left: `${currentTime * pixelsPerSecond + leftStarting}px`,
                }}
            />
        </div>
    );
};

export default Timeline;

