import subprocess
import os

source_path = ""
save_dir = ""
file_basename = ""

def convert_video_format(format):
    """
    Convert the video format from one to another.

    Args:
    format: The video format to convert to.
    """
    target_path = os.path.join(save_dir, f"{file_basename}.{format}")
    print(f"Converting video format from {source_path} to {format}")
    subprocess.run(["ffmpeg", "-i", source_path, "-acodec", "copy", "-vcodec", "copy", target_path], check=True)

def extract_audio_from_video():
    """
    Extract the audio from a video file.

    Args:
    source_path : The path to the source video file.
    target_path : The path to save the extracted audio file.
    """
    target_path = os.path.join(save_dir, f"{file_basename}.mp3")
    print("Extracting audio from video")
    subprocess.run(["ffmpeg", "-i", source_path, "-q:a", "0", "-map", "a", target_path], check=True)

def resize_video(width, height):
    """
    Resize the video to the specified dimensions.

    Args:
    width : The width of the resized video.
    height : The height of the resized video.
    """
    target_path = os.path.join(save_dir, f"{file_basename}_resized.mp4")
    scale = f"scale={width}:{height}"
    print(f"Resizing video to {width}x{height}")
    subprocess.run(["ffmpeg", "-i", source_path, "-vf", scale, target_path], check=True)

def trim_video(start_time, end_time):
    """
    Trim the video to the specified start and end times.

    Args:
    start_time : The start time of the trimmed video.
    end_time : The end time of the trimmed video.
    """
    target_path = os.path.join(save_dir, f"{file_basename}_trimmed.mp4")
    print(f"Trimming video from {start_time} to {end_time}")
    subprocess.run(["ffmpeg", "-i", source_path, "-ss", start_time, "-to", end_time, "-c", "copy", target_path], check=True)


def open_video(video_path):
    """
    Open a video file using ffplay.

    Args:
    video_path : The path to the video file to open.
    """
    try:
        # Normalize the path to ensure it's in the correct format for the OS
        normalized_path = os.path.normpath(video_path)
        
        # Ensure the path is correctly quoted to handle spaces and special characters
        command = ['ffplay', '-autoexit', f'"{normalized_path}"']
        
        # Use shell=True on Windows to handle path correctly
        subprocess.run(' '.join(command), check=True, shell=True)
    except subprocess.CalledProcessError:
        print("Failed to open video.")

