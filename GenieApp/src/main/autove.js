import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";

class VideoEditor {
    constructor() {
        ffmpeg.setFfprobePath(ffprobeStatic.path);
    }

    async processVideo(ffmpegCommand, successMessage, errorMessage) {
        return new Promise((resolve, reject) => {
            ffmpegCommand
                .on('end', () => {
                    console.log(successMessage);
                    resolve({ message: successMessage, status: 'success' });
                })
                .on('error', (err) => {
                    console.error(errorMessage, err);
                    reject({ message: errorMessage, error: err });
                })
                .run();
        });
    }

    resize_video(width, height, input_path, output_path) {
        const command = ffmpeg(input_path).size(`${width}x${height}`).output(output_path);
        return this.processVideo(command, `Video resized successfully to ${width}x${height}px`, 'Error resizing video');
    }

    convert_video_format(format, input_path, output_path) {
        const command = ffmpeg(input_path).toFormat(format).output(output_path);
        return this.processVideo(command, `Video converted to ${format} successfully`, 'Error converting video');
    }

    extract_audio_from_video(input_path, output_path) {
        const command = ffmpeg(input_path).noVideo().audioCodec('libmp3lame').output(output_path);
        return this.processVideo(command, 'Audio extracted successfully', 'Error extracting audio');
    }

    trim_video(start_time, end_time, input_path, output_path) {
        const command = ffmpeg(input_path).setStartTime(start_time).setDuration(end_time - start_time).output(output_path);
        return this.processVideo(command, 'Video trimmed successfully', 'Error trimming video');
    }

    compress_video(input_path, output_path, preset = 'medium') {
        const command = ffmpeg(input_path).videoCodec('libx264').preset(preset).output(output_path);
        return this.processVideo(command, 'Video compressed successfully', 'Error compressing video');
    }

    apply_basic_color_correction(brightness = 0, contrast = 0, saturation = 1, input_path, output_path) {
        const command = ffmpeg(input_path).videoFilters([
            `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`
        ]).output(output_path);
        return this.processVideo(command, 'Color correction applied successfully', 'Error applying color correction');
    }

    change_aspect_ratio(aspect_ratio, input_path, output_path) {
        const command = ffmpeg(input_path).aspect(aspect_ratio).output(output_path);
        return this.processVideo(command, 'Aspect ratio changed successfully', 'Error changing aspect ratio');
    }

    apply_slow_motion(speed = 0.5, input_path, output_path) {
        const command = ffmpeg(input_path)
            .videoFilters(`setpts=${1 / speed}*PTS`)
            .audioFilters(`atempo=${speed}`)
            .output(output_path);
        return this.processVideo(command, 'Slow motion applied successfully', 'Error applying slow motion');
    }
}

export default VideoEditor;
