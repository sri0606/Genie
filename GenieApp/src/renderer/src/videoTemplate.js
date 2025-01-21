const video = {
  id: 'unique-video-id',  // Unique identifier for the video
  name: 'sample-video.mp4',  // The video filename
  url: 'http://localhost:3000/media/projectID/sample-video/sample-video.mp4',  // Full video URL for access
  audioTrackURL: 'http://localhost:3000/media/sample-video/sample-video.mp3',  // Audio file URL (if extracted)
  dirLocation: 'C:/project/video-folder/sample-video',  // Path where the video is stored
  dirURL: 'http://localhost:3000/media/projectID/video-folder',  // URL of the folder containing the video
  thumbnailDirLocation: 'C:/project/video-folder/thumbanils', // Path where the thumbnail dir is
  editsDirLocation: 'C:/project/video-folder/edits', // Path where the edits dir is
  duration: 120,  // Duration in seconds
  numEdits: {
    video: 3,  // Number of video edits applied
    audio: 2,  // Number of audio edits applied
  },
  metadata: {
    size: '500MB',  // File size
    codec: 'H.264',  // Video codec used
    framerate: 30,  // Frames per second
  },
  current: {
    videoPath: "",
    audioPath: "",
  },
};
