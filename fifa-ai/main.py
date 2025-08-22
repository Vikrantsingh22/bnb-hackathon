import os
import io
import cv2
import time
import json
import base64
import shutil
import tempfile
import httpx
import asyncio
import numpy as np
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from ultralytics import YOLO
import yt_dlp
import subprocess
from pathlib import Path
import sys  # <-- added


OCR_ENDPOINT = os.getenv("OCR_ENDPOINT", "https://scoreboard-ai.catoff.xyz/upload-scorecard-results/")
YOLO_WEIGHTS = os.getenv("YOLO_WEIGHTS", "models/scoreboard.pt")  # <- your trained weights
CONF_THRESH  = float(os.getenv("CONF_THRESH", "0.6"))
NMS_IOU      = float(os.getenv("NMS_IOU", "0.5"))
FRAME_STEP   = int(os.getenv("FRAME_STEP", "2"))            # analyze every Nth frame
TAIL_SECONDS = int(os.getenv("TAIL_SECONDS", "1"))          # VOD: last N seconds to scan
LIVE_STABLE  = int(os.getenv("LIVE_STABLE", "10"))          # live: consecutive detections to consider "stable"
LIVE_TIMEOUT = int(os.getenv("LIVE_TIMEOUT", "1800"))        # hard cap per live job (seconds)

# Warn if weights missing
if not Path(YOLO_WEIGHTS).exists():
    print(f"[WARN] YOLO weights not found at '{YOLO_WEIGHTS}'. Set YOLO_WEIGHTS env or place file there.")


MODEL = YOLO(YOLO_WEIGHTS)

app = FastAPI(title="Scoreboard Sniper (OpenCV)")

class ExtractReq(BaseModel):
    url: HttpUrl
    platform: str  # "youtube" | "twitch"
    mode: str = "vod"  # "vod" | "live"
    ocr_layout: str = "match_results"
    return_image: bool = False


def best_detection(result) -> Optional[float]:
    "To Return best confidence if any 'scoreboard' box is present."
    if result is None or result.boxes is None:
        return None
    best = None
    for i in range(len(result.boxes)):
        conf = float(result.boxes.conf[i].item())
        if conf >= CONF_THRESH and (best is None or conf > best):
            best = conf
    return best

async def send_to_ocr(frame_bgr: np.ndarray) -> dict:
    ok, buf = cv2.imencode(".jpg", frame_bgr)
    if not ok:
        raise HTTPException(500, "Failed to encode frame.")
    files = {"file": ("frame.jpg", buf.tobytes(), "image/jpeg")}
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(OCR_ENDPOINT, files=files)
        r.raise_for_status()
        return r.json()

def download_vod(url: str) -> str:
    """
    Download a YouTube VOD to a temp file using yt-dlp.
    Returns the absolute file path.
    """
    tmpdir = tempfile.mkdtemp(prefix="vod_")
    outtmpl = os.path.join(tmpdir, "vid.%(ext)s")

    # First try: best video+audio, remux to mp4
    ydl_opts_main = {
        "outtmpl": outtmpl,
        "format": "best[ext=mp4]/best",  # only pick a single progressive stream
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }
    # Fallbacks we'll try if the first fails
    fallback_opts = [
        # Prefer mp4 tracks if available, else fallback to anything
        {
            "outtmpl": outtmpl,
            "format": ("bestvideo[ext=mp4]+bestaudio[ext=m4a]/"
                       "best[ext=mp4]/best"),
            "merge_output_format": "mp4",
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
        },
        # Last resort: any best single stream (may be webm)
        {
            "outtmpl": outtmpl,
            "format": "best",
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
        },
    ]

    # Helper that runs yt-dlp and returns the resolved filepath
    def _try_download(opts) -> Optional[str]:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            # yt-dlp tells us the actual file name it wrote:
            fp = ydl.prepare_filename(info)
            # If merged/remuxed, extension may change to .mp4
            base, _ = os.path.splitext(fp)
            # Check common endings in order
            for ext in (".mp4", ".mkv", ".webm", ".m4a", ".mp3"):
                candidate = base + ext
                if os.path.exists(candidate):
                    return candidate
            # Fall back to whatever was returned if it exists
            if os.path.exists(fp):
                return fp
        return None

    # Try main, then fallbacks
    fp = _try_download(ydl_opts_main)
    if not fp:
        for opts in fallback_opts:
            fp = _try_download(opts)
            if fp:
                break

    if not fp or not os.path.exists(fp):
        # Optional: dump available formats to help debugging
        # with yt_dlp.YoutubeDL({"quiet": False}) as ydl:
        #     ydl.download([f"-F|{url}"])
        raise HTTPException(500, "yt-dlp download failed (no compatible format).")

    return fp


def seek_to_tail(cap: cv2.VideoCapture, seconds: int) -> None:
    frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    tail_frames = int(fps * seconds)
    start = max(0, frames - tail_frames)
    cap.set(cv2.CAP_PROP_POS_FRAMES, start)

def scoreboard_from_vod(file_path: str) -> Optional[np.ndarray]:
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        return None
    # frame-jump
    seek_to_tail(cap, TAIL_SECONDS)

    best = {"conf": -1.0, "frame": None}
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % FRAME_STEP != 0:
            idx += 1
            continue
        res = MODEL.predict(source=frame, conf=CONF_THRESH, iou=NMS_IOU, verbose=False)[0]
        conf = best_detection(res)
        if conf is not None and conf > best["conf"]:
            best["conf"], best["frame"] = conf, frame.copy()
        if conf is not None:
            print(f"[YOLO][VOD] conf={conf:.3f}")
        idx += 1

    cap.release()
    return best["frame"]

def get_live_stream_url(url: str) -> Optional[str]:

    try:
        cmd = [sys.executable, "-m", "streamlink", "--stream-url", url, "best"]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if proc.returncode != 0:
            err = (proc.stderr or "").strip()
            print(f"[streamlink] exit={proc.returncode} stderr={err}")
            return None
        stream_url = (proc.stdout or "").strip()
        return stream_url if stream_url.startswith("http") else None
    except Exception as e:
        print(f"[streamlink] exception: {e}")
        return None

def scoreboard_from_live(stream_url: str, deadline: float) -> Optional[np.ndarray]:
    cap = cv2.VideoCapture(stream_url)
    if not cap.isOpened():
        return None
    stable = 0
    chosen = None
    idx = 0

    while time.time() < deadline:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % FRAME_STEP != 0:
            idx += 1
            continue
        res = MODEL.predict(source=frame, conf=CONF_THRESH, iou=NMS_IOU, verbose=False)[0]
        conf = best_detection(res)
        if conf is not None:
            stable += 1
            chosen = frame.copy()
            if stable >= LIVE_STABLE:
                print(f"[YOLO][LIVE] stable after {stable} frames, conf≈{conf:.3f}")
                break
        else:
            stable = 0
        idx += 1

    cap.release()
    return chosen

@app.post("/extract-scoreboard")
async def extract_scoreboard(req: ExtractReq):
    """
    VOD:
      - yt-dlp downloads file
      - OpenCV seeks to last TAIL_SECONDS
      - YOLO picks best scoreboard frame
    Live:
      - streamlink resolves best URL
      - OpenCV reads live frames
      - when detection stabilizes LIVE_STABLE frames, snap
    """
    start = time.time()
    tmpdirs = []
    try:
        if req.mode == "vod":
            fp = download_vod(str(req.url))
            tmpdirs.append(os.path.dirname(fp))  # remember temp dir
            frame = scoreboard_from_vod(fp)

        elif req.mode == "live":
            live_url = get_live_stream_url(str(req.url))
            if not live_url:
                raise HTTPException(
                    502,
                    "Could not resolve live stream URL via streamlink. "
                    "Ensure the channel is live and accessible, and that 'streamlink' works in this venv."
                )
            frame = scoreboard_from_live(live_url, deadline=time.time() + LIVE_TIMEOUT)

        else:
            raise HTTPException(400, "mode must be 'vod' or 'live'")

        if frame is None:
            raise HTTPException(422, "No scoreboard detected in the sampled window.")

        ocr_json = await send_to_ocr(frame)

        # ---- derive convenience fields from OCR for clients ----
        home = (ocr_json or {}).get("home", {}) or {}
        away = (ocr_json or {}).get("away", {}) or {}
        pen  = (ocr_json or {}).get("penalties", {}) or {}
        winner_side = (ocr_json or {}).get("winner")  

        home_label = home.get("label")
        away_label = away.get("label")
        home_goals = home.get("goals")
        away_goals = away.get("goals")

        scoreline = None
        if home_label is not None and away_label is not None and home_goals is not None and away_goals is not None:
            scoreline = f"{home_label} {home_goals} - {away_goals} {away_label}"

        # winner details
        home_won = winner_side == "home"
        away_won = winner_side == "away"
        winner_label = home_label if home_won else (away_label if away_won else None)

        # method: penalties vs regular
        win_method = None
        if winner_side in ("home", "away"):
            win_method = "penalties" if (pen.get("present") and home_goals == away_goals) else "regular"

        penalties_block = {
            "present": bool(pen.get("present")),
            "home": pen.get("home"),
            "away": pen.get("away"),
            "raw": pen.get("raw"),
        }

        wins_block = {
            "winner_side": winner_side,       
            "winner_label": winner_label,     
            "home_won": home_won,
            "away_won": away_won,
            "win_method": win_method          
        }

        payload = {
            "ok": True,
            "source_url": str(req.url),
            "mode": req.mode,
            "latency_sec": round(time.time() - start, 2),

            "ocr": ocr_json,

            # convenient top-level fields
            "scoreline": scoreline,
            "penalties": penalties_block,
            "wins": wins_block,
        }

        if req.return_image:
            ok, buf = cv2.imencode(".jpg", frame)
            if ok:
                payload["screenshot_b64"] = base64.b64encode(buf.tobytes()).decode("ascii")

        return payload

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"{type(e).__name__}: {e}")
    finally:
        for d in tmpdirs:
            shutil.rmtree(d, ignore_errors=True)
