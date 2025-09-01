from fastapi import APIRouter, Query
from typing import List, Optional
import os

from ..schemas import (
	ProcessedNewsItem,
	NewsItem,
	TTSRequest,
	TTSResponse,
	SlidesRequest,
	SlidesResponse,
)
from ..services.ingest import fetch_latest_news
from ..services.utils import simple_summarize
from ..services.translate import translate_text
from ..services.fact_check import fact_check_text
from ..services.bias import infer_bias_for_source
from ..services.tts import synthesize_speech
from ..services.video import generate_slides
from ..services.agents import run_agents
import asyncio


router = APIRouter()


@router.get("/news", response_model=List[ProcessedNewsItem])
async def get_news(
	mode: str = Query("read", enum=["read", "listen", "watch", "multilingual"]),
	language: str = Query("en"),
	topics: Optional[str] = Query(None, description="Comma-separated topics for personalization"),
	limit: int = Query(10, ge=1, le=50),
):
	items: List[NewsItem] = fetch_latest_news(limit=limit, topics=topics)
	processed: List[ProcessedNewsItem] = []

	for item in items:
		# Summarize
		base_text = item.content or item.title
		summary_en = simple_summarize(base_text, max_sentences=3)

		# Translate if needed
		final_language = language
		translated_summary = summary_en
		translation_language = None
		if language and language.lower() != "en":
			translated_summary = translate_text(summary_en, target_language=language)
			translation_language = language

		# Run agents concurrently (already parallelized inside)
		agents_bundle = None
		try:
			agents_bundle = await run_agents(item.title, base_text, topics)
		except Exception:
			agents_bundle = None

		# For compatibility, keep top-level fact_check field using verifier
		if agents_bundle and agents_bundle.verifier.sources is not None:
			fact_sources = agents_bundle.verifier.sources
			fact_conf = agents_bundle.verifier.confidence or 0.5
			fact_summary = agents_bundle.verifier.insight
			fact = type("X", (), {})()
			from ..schemas import FactCheckResult
			fact = FactCheckResult(confidence=fact_conf, summary=fact_summary, sources=fact_sources)
		else:
			fact = fact_check_text(item.title)

		# Bias inference for source
		bias = infer_bias_for_source(item.source.name)

		listen_url = None
		slide_urls = None
		if mode == "listen":
			try:
				listen_url = synthesize_speech(translated_summary, language or "en")
			except Exception:
				listen_url = None
		elif mode == "watch":
			try:
				slide_urls = generate_slides(translated_summary, language or "en")
			except Exception:
				slide_urls = None

		processed.append(
			ProcessedNewsItem(
				item=item,
				summary=translated_summary,
				language=final_language,
				translation_language=translation_language,
				fact_check=fact,
				bias=bias,
				listen_url=listen_url,
				slide_urls=slide_urls,
				mode=mode,
				agents=agents_bundle,
			)
		)

	return processed


@router.post("/tts", response_model=TTSResponse)
def tts(req: TTSRequest):
	url = synthesize_speech(req.text, req.language)
	static_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
	return TTSResponse(url=url, path=os.path.join(static_root, url.replace("/static/", "")))


@router.post("/slides", response_model=SlidesResponse)
def slides(req: SlidesRequest):
	urls = generate_slides(req.text, req.language)
	static_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
	paths = [os.path.join(static_root, u.replace("/static/", "")) for u in urls]
	return SlidesResponse(urls=urls, paths=paths)

