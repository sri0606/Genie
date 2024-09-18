FUNCTION_ARG_TYPES = {
    'convert_video_format': {
        'format': 'str'  # The video format to convert to (e.g., 'mp4', 'avi')
    },
    'extract_audio_from_video': {
        # No arguments required in the function definition
    },
    'resize_video': {
        'width': 'int',   # The width of the resized video
        'height': 'int'   # The height of the resized video
    },
    'trim_video': {
        'start_time': 'str',  # The start time of the trimmed video (e.g., '00:00:10')
        'end_time': 'str'     # The end time of the trimmed video (e.g., '00:02:00')
    },
    'open_video': {
        'video_path': 'str'  # The path to the video file to open
    }
}
