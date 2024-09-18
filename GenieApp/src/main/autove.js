class VideoEditor {
    constructor(current_path = "") {
        this.current_path = current_path;
    }

    resize_video(width, height) {
        console.log("video path: " + this.current_path);
        console.log("resize_video called with width:", width, "and height:", height);
    }

    convert_video_format(format) {
        console.log("convert_video_format called with format:", format);
    }

    open_video(video_path) {
        console.log("open_video called with video name:", video_path);
    }

    extract_audio_from_video() {
        console.log("extract_audio_from_video called with video name:");
    }

    trim_video(start_time, end_time) {
        console.log("trim_video called with start time:", start_time, "and end time:", end_time);
    }
}


export default VideoEditor;