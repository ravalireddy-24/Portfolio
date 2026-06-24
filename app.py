import os
from typing import Any, Dict, Tuple

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

load_dotenv()

app = Flask(__name__)

HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")
HEYGEN_AVATAR_ID = os.getenv("HEYGEN_AVATAR_ID", "Daisy-inskirt-20220818")
HEYGEN_VOICE_ID = os.getenv("HEYGEN_VOICE_ID", "1bd001e7e50f421d891986aad5c8bbd2")
HEYGEN_GENERATE_URL = "https://api.heygen.com/v2/video/generate"
HEYGEN_STATUS_URL = "https://api.heygen.com/v1/video_status.get"
REQUEST_TIMEOUT = int(os.getenv("HEYGEN_REQUEST_TIMEOUT", "30"))

BASE_PORTFOLIO_SCRIPT = " ".join(
    [
        "[wave] Hi, welcome to Ravali’s portfolio.",
        "[smile] I can guide you through experience, projects, skills, resume, and contact.",
        "[point] Let me show you the selected section.",
        "[nod] Thanks for visiting Ravali’s portfolio.",
    ]
)

SECTION_SCRIPTS = {
    "home": BASE_PORTFOLIO_SCRIPT,
    "experience": " ".join(
        [
            "[wave] Hi, welcome to Ravali’s portfolio.",
            "[smile] Ravali builds full-stack applications, data workflows, cloud services, APIs, and automation.",
            "[point] Let me show you the selected experience section.",
            "[nod] Thanks for visiting Ravali’s portfolio.",
        ]
    ),
    "projects": " ".join(
        [
            "[wave] Hi, welcome to Ravali’s portfolio.",
            "[smile] Ravali’s projects include AI features, Flask and React apps, dashboards, cloud integrations, and automation.",
            "[point] Let me show you the selected projects section.",
            "[nod] Thanks for visiting Ravali’s portfolio.",
        ]
    ),
    "skills": " ".join(
        [
            "[wave] Hi, welcome to Ravali’s portfolio.",
            "[smile] Ravali works with Python, Java, JavaScript, React, Flask, SQL, AWS, REST APIs, HTML, CSS, Git, and AI tools.",
            "[point] Let me show you the selected skills section.",
            "[nod] Thanks for visiting Ravali’s portfolio.",
        ]
    ),
    "resume": " ".join(
        [
            "[wave] Hi, welcome to Ravali’s portfolio.",
            "[smile] The resume section summarizes Ravali’s education, experience, projects, and technical strengths.",
            "[point] Let me show you the selected resume section.",
            "[nod] Thanks for visiting Ravali’s portfolio.",
        ]
    ),
    "contact": " ".join(
        [
            "[wave] Hi, welcome to Ravali’s portfolio.",
            "[smile] You can contact Ravali through email, LinkedIn, or GitHub for software, data, cloud, and AI-focused roles.",
            "[point] Let me show you the selected contact section.",
            "[nod] Thanks for visiting Ravali’s portfolio.",
        ]
    ),
}


def heygen_headers() -> Dict[str, str]:
    return {"X-Api-Key": HEYGEN_API_KEY or "", "Content-Type": "application/json"}


def api_key_error() -> Tuple[Any, int] | None:
    if HEYGEN_API_KEY:
        return None
    return jsonify({"error": "HEYGEN_API_KEY is missing. Add it to your .env file and restart Flask."}), 500


def parse_heygen_response(response: requests.Response) -> Dict[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text}
    if response.ok:
        return payload
    message = payload.get("message") or payload.get("error") or payload
    raise RuntimeError(f"HeyGen API returned {response.status_code}: {message}")


@app.route("/")
def home():
    return render_template("index.html")


@app.post("/api/generate-avatar-video")
def generate_avatar_video():
    missing_key = api_key_error()
    if missing_key:
        return missing_key

    body = request.get_json(silent=True) or {}
    section = str(body.get("section", "home")).lower()
    script = str(body.get("script") or SECTION_SCRIPTS.get(section, BASE_PORTFOLIO_SCRIPT)).strip()

    if not script:
        return jsonify({"error": "A non-empty script is required."}), 400

    heygen_payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": body.get("avatar_id") or HEYGEN_AVATAR_ID,
                    "avatar_style": "normal",
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": body.get("voice_id") or HEYGEN_VOICE_ID,
                },
            }
        ],
        "dimension": {"width": 1280, "height": 720},
        "caption": False,
    }

    try:
        response = requests.post(
            HEYGEN_GENERATE_URL,
            headers=heygen_headers(),
            json=heygen_payload,
            timeout=REQUEST_TIMEOUT,
        )
        payload = parse_heygen_response(response)
    except requests.Timeout:
        return jsonify({"error": "Timed out while asking HeyGen to start rendering. Please try again."}), 504
    except requests.RequestException as exc:
        return jsonify({"error": f"Could not reach HeyGen: {exc}"}), 502
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 502

    video_id = (payload.get("data") or {}).get("video_id") or payload.get("video_id")
    if not video_id:
        return jsonify({"error": "HeyGen did not return a video_id.", "heygen_response": payload}), 502

    return jsonify({"video_id": video_id, "status": "processing", "script": script})


@app.get("/api/video-status/<video_id>")
def video_status(video_id: str):
    missing_key = api_key_error()
    if missing_key:
        return missing_key

    try:
        response = requests.get(
            HEYGEN_STATUS_URL,
            headers={"X-Api-Key": HEYGEN_API_KEY or ""},
            params={"video_id": video_id},
            timeout=REQUEST_TIMEOUT,
        )
        payload = parse_heygen_response(response)
    except requests.Timeout:
        return jsonify({"error": "Timed out while checking HeyGen render status. Poll again in a few seconds."}), 504
    except requests.RequestException as exc:
        return jsonify({"error": f"Could not reach HeyGen: {exc}"}), 502
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 502

    data = payload.get("data") or payload
    status = str(data.get("status", "unknown")).lower()
    video_url = data.get("video_url") or data.get("video_url_caption") or data.get("url")
    error = data.get("error") or data.get("error_msg") or data.get("message")

    if status in {"completed", "complete", "done", "success"} and video_url:
        return jsonify({"video_id": video_id, "status": "completed", "video_url": video_url})
    if status in {"failed", "fail", "error"}:
        return jsonify({"video_id": video_id, "status": "failed", "error": error or "HeyGen video rendering failed."}), 502

    return jsonify({"video_id": video_id, "status": status, "message": "Video is still rendering."})



if __name__ == "__main__":
    app.run(debug=True)
