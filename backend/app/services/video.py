import os
from uuid import uuid4
from typing import List
from textwrap import wrap

try:
	from PIL import Image, ImageDraw, ImageFont
except Exception:  # pragma: no cover
	Image = None
ImageDraw = None
ImageFont = None


def _ensure_dirs(static_root: str):
	os.makedirs(os.path.join(static_root, "slides"), exist_ok=True)


def _create_slide(text: str, size=(1280, 720)) -> bytes:
	if Image is None:
		return b""
	img = Image.new("RGB", size, color=(245, 248, 250))
	draw = ImageDraw.Draw(img)
	try:
		font = ImageFont.truetype("DejaVuSans.ttf", 36)
	except Exception:
		font = ImageFont.load_default()

	margin = 80
	max_width = size[0] - 2 * margin
	lines = []
	for paragraph in text.split("\n"):
		for wline in wrap(paragraph, width=40):
			lines.append(wline)

	x, y = margin, margin
	for line in lines:
		draw.text((x, y), line, font=font, fill=(20, 23, 26))
		y += 48

	from io import BytesIO
	buf = BytesIO()
	img.save(buf, format="PNG")
	return buf.getvalue()


def generate_slides(text: str, language: str = "en") -> List[str]:
	static_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
	_ensure_dirs(static_root)
	uid = uuid4().hex

	# naive segmentation into up to 3 slides
	segments = [seg.strip() for seg in text.split(". ") if seg.strip()]
	if not segments:
		segments = [text]
	segments = segments[:3]

	urls: List[str] = []
	for idx, seg in enumerate(segments, start=1):
		filename = f"slides/{uid}_{idx}.png"
		filepath = os.path.join(static_root, filename)
		try:
			png_bytes = _create_slide(seg)
			with open(filepath, "wb") as f:
				f.write(png_bytes)
		except Exception:
			with open(filepath, "wb") as f:
				f.write(b"")
		urls.append(f"/static/{filename}")

	return urls

