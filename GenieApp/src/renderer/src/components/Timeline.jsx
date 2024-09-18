import React, { useState, useEffect, useCallback } from 'react';
import './Timeline.css';

const Timeline = ({ reactPlayerRef, projectURL }) => {
    const [duration, setDuration] = useState(60);
    const [currentTime, setCurrentTime] = useState(0);
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


    // Listen for video duration change
    useEffect(() => {
        const player = reactPlayerRef.current;

        const updateDuration = () => {
            const videoDuration = player.getDuration();
            setDuration(videoDuration);
        };

        // Update the duration when the video is loaded
        if (player) {
            updateDuration();

            // Optionally, if the video changes, listen for duration changes dynamically
            player.getInternalPlayer().addEventListener('loadedmetadata', updateDuration);

            return () => {
                player.getInternalPlayer().removeEventListener('loadedmetadata', updateDuration);
            };
        }
    }, [reactPlayerRef]);


    const handlePlayPause = () => {
        if (reactPlayerIsPlaying) {
            reactPlayerSetIsPlaying(false);
        }
        else {
            reactPlayerSetIsPlaying(true);
        }
        // setIsPlaying(!isPlaying);
    };


    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getThumbnailURL = (timeIndex) => {
        return `${projectURL}/thumbnails/${timeIndex}.png`;
    };

    const handleTimeChange = (timeIndex) => {
        if (reactPlayerRef.current) {
            const fraction = timeIndex / duration;
            // Check if fraction is finite
            if (isFinite(fraction)) {
                reactPlayerRef.current.seekTo(fraction, "fraction");
            } else {
                console.error("Invalid fraction value:", fraction);
            }
        }
    };

    const Thumbnail = ({ timeIndex, index }) => {
        const [imageError, setImageError] = useState(false);

        const handleClick = () => {
            console.log('Thumbnail clicked:', timeIndex);
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
    };




    // Generate an array of time indices for thumbnails
    const thumbnailTimes = [];
    for (let time = 0; time <= duration; time += majorMarkerInterval) {
        thumbnailTimes.push(time);
    }

    return (
        <div className="timeline-container">
            <div
                className="timeline-marker-wrapper"
                style={{ width: `${totalWidth + 2 * leftStarting}px` }}
            >
                {/* Time markers */}
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
            {/* Thumbnails */}
            <div className="thumbnail-container">
                {thumbnailTimes.map((timeIndex, index) => (
                    <Thumbnail key={index} timeIndex={timeIndex} index={index} />
                ))}
            </div>
            {/* Current time indicator */}
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