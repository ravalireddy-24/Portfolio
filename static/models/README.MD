# Ravali Portfolio HeyGen Avatar Assistant

A Flask portfolio page that uses the HeyGen API v2 to generate realistic talking avatar MP4 videos. The browser sends a selected script to Flask, Flask starts a HeyGen render without waiting for completion, and the frontend polls `/api/video-status/<video_id>` until the final MP4 URL is ready.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

```bash
HEYGEN_API_KEY=your_real_key
HEYGEN_AVATAR_ID=your_avatar_id
HEYGEN_VOICE_ID=your_voice_id
```

You can find avatar and voice IDs from the HeyGen dashboard/API. The app reads `HEYGEN_API_KEY` with `python-dotenv`.

## Run

```bash
python app.py
```

Open <http://127.0.0.1:5000>. Use Chrome or Edge on localhost for Web Speech API microphone support.

## API routes

- `GET /` renders the portfolio page.
- `POST /api/generate-avatar-video` starts a HeyGen API v2 avatar video render and returns `video_id` immediately.
- `GET /api/video-status/<video_id>` checks render status and returns the final MP4 `video_url` when complete.

## Notes

- This project does not create an SVG avatar, CSS cartoon, or PNG animation.
- The frontend uses the returned HeyGen MP4 only.
- The Flask request that starts rendering returns immediately after HeyGen creates the job; the frontend handles polling.
