import path from 'path';

const pathJoinURL = (url,...vals)=>{ return url + '/' + vals.join('/')}

const createProjectObject = ({
  id,
  name = null,
  projectDataDir,
  videos = [],
  chatMessages = [],
}) => {
  return {
    id: id || 'unique-project-id',  // Unique identifier for the project
    name : name || id,
    projectDataDir,  // Directory on disk for storing project-related files
    videos,  // Array of video objects
    chatMessages,  // Array of chat messages
    metadata: {
      createdAt: new Date().toISOString(),  // Creation date
      lastModified: new Date().toISOString(),  // Last modified date
    },
  };
};

const createVideoObject = ({
  id,
  name,
  projectDataDir,
  projectURL,
  fileBaseName,
  fileName,
  duration = null,
  numVideoEdits = 0,
  numAudioEdits = 0,
  size = 'Unknown',
  codec = 'Unknown',
  framerate = 0,
  audioLocation,
  location
}) => {
  const dirLocation = path.join(projectDataDir, fileBaseName);
  const url = pathJoinURL(projectURL, fileBaseName, fileName);
  const audioTrackURL = pathJoinURL(projectURL, fileBaseName, fileBaseName + '.mp3');
  
  return {
    id: id || 'unique-video-id',  // Generate or pass a unique identifier
    name,
    url,
    location,
    audioLocation,
    dirLocation,
    dirURL: pathJoinURL(projectURL, fileBaseName),
    thumbnailDirLocation: path.join(projectDataDir, fileBaseName, "thumbnails"),
    editsDirLocation: path.join(projectDataDir, fileBaseName, "edits"),
    duration,
    numEdits: {
      video: numVideoEdits,
      audio: numAudioEdits,
    },
    metadata: {
      size,
      codec,
      framerate,
    },
    current: {
      videoPath: url,
      audioPath: audioTrackURL,
    },
  };
};

export {createProjectObject, createVideoObject};