import os
from uuid import uuid4

try:
	from gtts import gTTS
except Exception:  # pragma: no cover
	gTTS = None


def synthesize_speech(text: str, language: str = "en") -> str:
	if not text:
		raise ValueError("No text provided for TTS")
	static_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
	os.makedirs(os.path.join(static_root, "tts"), exist_ok=True)
	filename = f"tts/{uuid4().hex}.mp3"
	filepath = os.path.join(static_root, filename)
	if gTTS is None:
		# create an empty file as placeholder
		with open(filepath, "wb") as f:
			f.write(b"")
		return f"/static/{filename}"
	try:
		tts = gTTS(text=text, lang=language if language else "en")
		tts.save(filepath)
		return f"/static/{filename}"
	except Exception:
		# fallback to placeholder
		with open(filepath, "wb") as f:
			f.write(b"")
		return f"/static/{filename}"

