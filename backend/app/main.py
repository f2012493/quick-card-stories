from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .routers.news import router as news_router


def create_app() -> FastAPI:
	app = FastAPI(title="News Buddy - India", version="0.1.0")

	# CORS for local dev and simple clients
	app.add_middleware(
		CORSMiddleware,
		allow_origins=["*"],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	# Ensure static directories exist for generated assets (tts, slides, frontend)
	static_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
	os.makedirs(os.path.join(static_root, "tts"), exist_ok=True)
	os.makedirs(os.path.join(static_root, "slides"), exist_ok=True)
	os.makedirs(os.path.join(static_root, "frontend"), exist_ok=True)

	# Copy/refresh frontend files into static if available
	project_frontend = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
	if os.path.isdir(project_frontend):
		for name in ["index.html", "styles.css", "app.js"]:
			src = os.path.join(project_frontend, name)
			dst = os.path.join(static_root, "frontend", name)
			try:
				if os.path.isfile(src):
					with open(src, "rb") as fsrc, open(dst, "wb") as fdst:
						fdst.write(fsrc.read())
			except Exception:
				pass

	app.mount("/static", StaticFiles(directory=static_root), name="static")

	# Serve the frontend index
	from fastapi.responses import HTMLResponse

	@app.get("/")
	def index():
		index_path = os.path.join(static_root, "frontend", "index.html")
		if os.path.exists(index_path):
			with open(index_path, "r", encoding="utf-8") as f:
				return HTMLResponse(content=f.read())
		return {"message": "Frontend not available"}

	@app.get("/api/health")
	def health_check():
		return {"status": "ok"}

	app.include_router(news_router, prefix="/api")

	return app


app = create_app()

