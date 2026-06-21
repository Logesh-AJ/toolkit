"""
Video/audio processing service functions, all powered by FFmpeg/FFprobe
via subprocess. Kept dependency-free (no python ffmpeg wrapper) for
maximum control over codecs, bitrates, and error surfaces.
"""

import json
import subprocess
from pathlib import Path
from typing import Optional


class FFmpegError(Exception):
    """Raised when an ffmpeg/ffprobe subprocess fails."""
    pass


def _run_ffmpeg(args: list[str], timeout: int = 300) -> None:
    """Run an ffmpeg command, raising FFmpegError with stderr on failure."""
    result = subprocess.run(
        ["ffmpeg", "-y", *args],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if result.returncode != 0:
        # ffmpeg's stderr is verbose; keep the last ~500 chars, usually the actual error
        tail = result.stderr.strip()[-500:]
        raise FFmpegError(f"FFmpeg failed: {tail}")


def get_media_info(input_path: Path) -> dict:
    """Probe a media file for duration, format, and stream info via ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height",
            "-of", "json",
            str(input_path),
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise FFmpegError(f"FFprobe failed: {result.stderr.strip()[-300:]}")

    return json.loads(result.stdout)


def get_duration_seconds(input_path: Path) -> float:
    """Return the media duration in seconds."""
    info = get_media_info(input_path)
    return float(info.get("format", {}).get("duration", 0))


# ---------------------------------------------------------------------------
# Convert Video Format
# ---------------------------------------------------------------------------

VIDEO_CODEC_MAP = {
    ".mp4": ["-c:v", "libx264", "-c:a", "aac"],
    ".mov": ["-c:v", "libx264", "-c:a", "aac"],
    ".avi": ["-c:v", "mpeg4", "-c:a", "libmp3lame"],
    ".mkv": ["-c:v", "libx264", "-c:a", "aac"],
}


def convert_video(input_path: Path, output_path: Path) -> None:
    """Convert a video to a different container/codec based on output extension."""
    target_ext = output_path.suffix.lower()
    codec_args = VIDEO_CODEC_MAP.get(target_ext, ["-c:v", "libx264", "-c:a", "aac"])

    _run_ffmpeg([
        "-i", str(input_path),
        *codec_args,
        "-movflags", "+faststart" if target_ext == ".mp4" else "",
        str(output_path),
    ], timeout=600)


# ---------------------------------------------------------------------------
# Compress Video
# ---------------------------------------------------------------------------

# CRF: lower = higher quality/larger file. 23 is a sane default; 28-32 is "high compression"
CRF_PRESETS = {"low": 28, "medium": 23, "high": 18}


def compress_video(input_path: Path, output_path: Path, level: str = "medium") -> dict:
    """
    Compress a video using H.264 CRF encoding.
    level: 'low' (more compression, smaller file) | 'medium' | 'high' (less compression, bigger file)
    """
    crf = CRF_PRESETS.get(level, 23)
    original_size = input_path.stat().st_size

    _run_ffmpeg([
        "-i", str(input_path),
        "-c:v", "libx264", "-crf", str(crf), "-preset", "medium",
        "-c:a", "aac", "-b:a", "128k",
        str(output_path),
    ], timeout=900)

    compressed_size = output_path.stat().st_size

    return {
        "original_size": original_size,
        "compressed_size": compressed_size,
        "reduction_percent": round((1 - compressed_size / original_size) * 100, 1) if original_size else 0,
    }


# ---------------------------------------------------------------------------
# Trim / Cut Video
# ---------------------------------------------------------------------------

def trim_video(input_path: Path, output_path: Path, start_seconds: float, end_seconds: float) -> None:
    """
    Cut a video to [start_seconds, end_seconds]. Uses stream copy when possible
    for speed; falls back to re-encode if copy fails (e.g. non-keyframe cuts).
    """
    duration = max(0.1, end_seconds - start_seconds)

    try:
        _run_ffmpeg([
            "-ss", str(start_seconds),
            "-i", str(input_path),
            "-t", str(duration),
            "-c", "copy",
            str(output_path),
        ], timeout=300)
    except FFmpegError:
        # Stream copy can fail to land exactly on keyframes — re-encode as fallback
        _run_ffmpeg([
            "-ss", str(start_seconds),
            "-i", str(input_path),
            "-t", str(duration),
            "-c:v", "libx264", "-c:a", "aac",
            str(output_path),
        ], timeout=600)


# ---------------------------------------------------------------------------
# Extract Audio from Video
# ---------------------------------------------------------------------------

def extract_audio(input_path: Path, output_path: Path) -> None:
    """Extract the audio track from a video file as MP3."""
    _run_ffmpeg([
        "-i", str(input_path),
        "-vn",  # no video
        "-c:a", "libmp3lame", "-q:a", "2",
        str(output_path),
    ], timeout=300)


# ---------------------------------------------------------------------------
# Convert Audio Format
# ---------------------------------------------------------------------------

AUDIO_CODEC_MAP = {
    ".mp3": ["-c:a", "libmp3lame", "-q:a", "2"],
    ".wav": ["-c:a", "pcm_s16le"],
    ".aac": ["-c:a", "aac", "-b:a", "192k"],
}


def convert_audio(input_path: Path, output_path: Path) -> None:
    """Convert an audio file to a different format based on output extension."""
    target_ext = output_path.suffix.lower()
    codec_args = AUDIO_CODEC_MAP.get(target_ext, ["-c:a", "libmp3lame", "-q:a", "2"])

    _run_ffmpeg([
        "-i", str(input_path),
        *codec_args,
        str(output_path),
    ], timeout=300)