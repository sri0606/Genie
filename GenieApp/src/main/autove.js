import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import fs from "fs";
import path from "path";

class VideoEditor {
    constructor(mediaDir) {
        this.mediaDir = mediaDir;
        ffmpeg.setFfprobePath(ffprobeStatic.path);
    }

    resize_video(width, height, output_path) {
        return new Promise((resolve, reject) => {
            ffmpeg(this.current_path)
                .size(`${width}x${height}`)
                .output(output_path)
                .on('end', () => {
                    console.log('Video resized successfully');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error resizing video:', err);
                    reject(err);
                })
                .run();
        });
    }

    convert_video_format(format, output_path) {
        return new Promise((resolve, reject) => {
            ffmpeg(this.current_path)
                .toFormat(format)
                .output(output_path)
                .on('end', () => {
                    console.log(`Video converted to ${format} successfully`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error converting video:', err);
                    reject(err);
                })
                .run();
        });
    }

    open_video(video_path) {
        if (fs.existsSync(video_path)) {
            this.current_path = video_path;
            console.log("Video opened:", video_path);
        } else {
            throw new Error("Video file not found");
        }
    }

    extract_audio_from_video(output_path) {
        return new Promise((resolve, reject) => {
            ffmpeg(this.current_path)
                .noVideo()
                .audioCodec('libmp3lame')
                .output(output_path)
                .on('end', () => {
                    console.log('Audio extracted successfully');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error extracting audio:', err);
                    reject(err);
                })
                .run();
        });
    }

    trim_video(start_time, end_time, output_path) {
        return new Promise((resolve, reject) => {
            ffmpeg(this.current_path)
                .setStartTime(start_time)
                .setDuration(end_time - start_time)
                .output(output_path)
                .on('end', () => {
                    console.log('Video trimmed successfully');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error trimming video:', err);
                    reject(err);
                })
                .run();
        });
    }

    compress_video(output_path, preset = 'medium') {
        return new Promise((resolve, reject) => {
            ffmpeg(this.current_path)
                .videoCodec('libx264')
                .preset(preset)
                .output(output_path)
                .on('end', () => {
                    console.log('Video compressed successfully');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error compressing video:', err);
                    reject(err);
                })
                .run();
        });
    }

    apply_basic_color_correction(brightness = 0, contrast = 0, saturation = 1, output_path) {
        return new Promise((resolve, reject) => {
            ffmpeg(this.current_path)
                .videoFilters([
                    `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`
                ])
                .output(output_path)
                .on('end', () => {
                    console.log('Color correction applied successfully');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error applying color correction:', err);
                    reject(err);
                })
                .run();
        });
    }

    change_aspect_ratio(aspect_ratio, output_path) {
        return new Promise((resolve, reject) => {
            ffmpeg(this.current_path)
                .aspect(aspect_ratio)
                .output(output_path)
                .on('end', () => {
                    console.log('Aspect ratio changed successfully');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error changing aspect ratio:', err);
                    reject(err);
                })
                .run();
        });
    }

    apply_slow_motion(speed = 0.5, output_path) {
        return new Promise((resolve, reject) => {
            ffmpeg(this.current_path)
                .videoFilters(`setpts=${1/speed}*PTS`)
                .audioFilters(`atempo=${speed}`)
                .output(output_path)
                .on('end', () => {
                    console.log('Slow motion applied successfully');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error applying slow motion:', err);
                    reject(err);
                })
                .run();
        });
    }
}

export default VideoEditor;