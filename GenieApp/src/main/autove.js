import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import path from "path";

class VideoEditor {
    constructor() {
        ffmpeg.setFfprobePath(ffprobeStatic.path);
    }

    getOutputPath(input_path, output_path, extension = null) {
        // If extension is not provided, use the input file's extension
        const ext = extension ? `.${extension}` : path.extname(input_path);
        // Add extension to output_path if it's not provided
        const outputWithExtension = path.extname(output_path) === '' ? `${output_path}${ext}` : output_path;
        return outputWithExtension;
    }

    async processVideo(ffmpegCommand, successMessage, errorMessage, paths, videoEdited = true, audioEdited = false) {
        return new Promise((resolve, reject) => {
            ffmpegCommand
                .on('end', () => {
                    console.log(successMessage);
                    resolve({ message: successMessage, status: 'success', videoEdited: videoEdited, audioEdited: audioEdited, paths: paths });
                })
                .on('error', (err) => {
                    console.error(errorMessage, err);
                    reject({ message: errorMessage, error: err });
                })
                .run();
        });
    }

    resize_video(width, height, paths) {
        paths.video.output = this.getOutputPath(paths.video.input, paths.video.output, null);
        const command = ffmpeg(paths.video.input).size(`${width}x${height}`).output(paths.video.output);
        return this.processVideo(command, `Video resized successfully to ${width}x${height}px`, 'Error resizing video', paths);
    }

    convert_video_format(format, paths) {
        paths.video.output = this.getOutputPath(paths.video.input, paths.video.output, format);
        const command = ffmpeg(paths.video.input).toFormat(format).output(paths.video.output);
        return this.processVideo(command, `Video converted to ${format} successfully`, 'Error converting video', paths);
    }

    extract_audio_from_video(paths) {
        paths.audio.output = this.getOutputPath(paths.video.input, paths.audio.output, "mp3");
        const command = ffmpeg(paths.video.input).noVideo().audioCodec('libmp3lame').output(paths.audio.output);
        return this.processVideo(command, 'Audio extracted successfully', 'Error extracting audio', paths, false, true);
    }

    trim_video(start_time, end_time, paths) {
        paths.video.output = this.getOutputPath(paths.video.input, paths.video.output, null);
        const command = ffmpeg(paths.video.input).setStartTime(start_time).setDuration(end_time - start_time).output(paths.video.output);
        return this.processVideo(command, 'Video trimmed successfully', 'Error trimming video', paths);
    }

    compress_video(paths, preset = 'medium') {
        paths.video.output = this.getOutputPath(paths.video.input, paths.video.output, null);
        const command = ffmpeg(paths.video.input).videoCodec('libx264').preset(preset).output(paths.video.output);
        return this.processVideo(command, 'Video compressed successfully', 'Error compressing video', paths);
    }

    apply_basic_color_correction(brightness = 0, contrast = 0, saturation = 1, paths) {
        paths.video.output = this.getOutputPath(paths.video.input, paths.video.output, null);
        const command = ffmpeg(paths.video.input).videoFilters([
            `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`
        ]).output(paths.video.output);
        return this.processVideo(command, 'Color correction applied successfully', 'Error applying color correction', paths);
    }

    change_aspect_ratio(aspect_ratio, paths) {
        paths.video.output = this.getOutputPath(paths.video.input, paths.video.output, null);
        const command = ffmpeg(paths.video.input).aspect(aspect_ratio).output(paths.video.output);
        return this.processVideo(command, 'Aspect ratio changed successfully', 'Error changing aspect ratio', paths);
    }

    apply_slow_motion(speed = 0.5, paths) {
        paths.video.output = this.getOutputPath(paths.video.input, paths.video.output, null);
        const command = ffmpeg(paths.video.input)
            .videoFilters(`setpts=${1 / speed}*PTS`)
            .audioFilters(`atempo=${speed}`)
            .output(paths.video.output);
        return this.processVideo(command, 'Slow motion applied successfully', 'Error applying slow motion', paths);
    }
}

export default VideoEditor;
