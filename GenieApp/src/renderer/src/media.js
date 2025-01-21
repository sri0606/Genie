class Video {
    constructor(name, videoURL, dirLocation, dirURL,maxEditHistory=10) {
        this.name = name;
        this.dirLocation = dirLocation;
        this.dirURL = dirURL;
        this.editHistory = new EditHistory(maxEditHistory);
        this.currentVideoInView = videoURL;
    }
    
    getURL() {
        return this.dirURL;
    }

    getCurrentVideo(){
        return this.currentVideoInView;
    }

    setCurrentVideo(path){
        this.currentVideoInView = path;
    }
    getFullPath() {
        return window.api.pathJoin(this.dirLocation, this.name);
    }

    getVideoEditOutputPath() {
        const editIndex = this.editHistory.videoHistory.length + 1;
        return window.api.pathJoin(this.dirLocation, "edits", "video", `edit_${editIndex}`);
    }
    getAudioEditOutputPath() {
        const editIndex = this.editHistory.audioHistory.length + 1;
        return window.api.pathJoin(this.dirLocation, "edits", "audio", `edit_${editIndex}`);
    }
}

class Audio {
    constructor(name, dirLocation, duration, format) {
        this.name = name;
        this.dirLocation = dirLocation;
        this.duration = duration; // in seconds
        this.format = format; // e.g., 'mp3'
        this.editHistory = new EditHistory(); // Optional
    }

    getFullPath() {
        return window.api.pathJoin(this.dirLocation, this.name);
    }

    getEditOutputPath() {
        const editIndex = this.editHistory.audioHistory.length + 1;
        return window.api.pathJoin(this.dirLocation, "edits", "audio", `edit_${editIndex}`);
    }
}

class Image {
    constructor(name, dirLocation, resolution, format) {
        this.name = name;
        this.dirLocation = dirLocation;
        this.resolution = resolution; // e.g., { width: 1920, height: 1080 }
        this.format = format; // e.g., 'png', 'jpg'
        this.editHistory = new EditHistory(); // Optional
    }

    getFullPath() {
        return window.api.pathJoin(this.dirLocation, this.name);
    }

    getEditOutputPath() {
        const editIndex = this.editHistory.imageHistory.length + 1;
        return window.api.pathJoin(this.dirLocation, "edits", "image", `edit_${editIndex}`);
    }
}

class EditHistory {
    constructor(maxHistory = 10) {
        this.videoHistory = [];
        this.audioHistory = [];
        this.imageHistory = [];
        this.maxHistory = maxHistory;
    }

    addVideoEdit(path) {
        this._addEdit(this.videoHistory, path);
    }

    addAudioEdit(path) {
        this._addEdit(this.audioHistory, path);
    }

    addImageEdit(path) {
        this._addEdit(this.imageHistory, path);
    }

    _addEdit(historyArray, path) {
        historyArray.push(path);
        if (historyArray.length > this.maxHistory) {
            historyArray.shift(); // Remove the oldest edit if maxHistory is exceeded
        }
    }

    getCurrentVideoPath() {
        return this._getCurrentPath(this.videoHistory);
    }

    getCurrentAudioPath() {
        return this._getCurrentPath(this.audioHistory);
    }

    getCurrentImagePath() {
        return this._getCurrentPath(this.imageHistory);
    }

    _getCurrentPath(historyArray) {
        return historyArray.length > 0 ? historyArray[historyArray.length - 1] : null;
    }

    undoVideoEdit() {
        return this._undoEdit(this.videoHistory);
    }

    undoAudioEdit() {
        return this._undoEdit(this.audioHistory);
    }

    undoImageEdit() {
        return this._undoEdit(this.imageHistory);
    }

    _undoEdit(historyArray) {
        if (historyArray.length > 1) {
            historyArray.pop(); // Remove the latest edit
            return historyArray[historyArray.length - 1]; // Return the second-last edit
        }
        return null;
    }
}
