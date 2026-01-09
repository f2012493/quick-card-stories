from typing import List, Optional
import feedparser
from datetime import datetime

from ..schemas import NewsItem, SourceMeta
from .utils import stable_id


# Curated initial Indian news RSS sources (mix of English/Hindi)
INDIAN_RSS_SOURCES = [
	{"name": "The Hindu", "url": "https://www.thehindu.com/news/feeder/default.rss"},
	{"name": "Indian Express", "url": "https://indianexpress.com/section/india/feed/"},
	{"name": "Hindustan Times", "url": "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml"},
	{"name": "NDTV", "url": "https://feeds.feedburner.com/ndtvnews-top-stories"},
	{"name": "Times of India", "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"},
	{"name": "Aaj Tak", "url": "https://www.aajtak.in/rssfeeds/?id=home"},
]


def _coalesce(*values: Optional[str]) -> Optional[str]:
	for v in values:
		if v and isinstance(v, str) and v.strip():
			return v
	return None


def fetch_latest_news(limit: int = 10, topics: Optional[str] = None) -> List[NewsItem]:
	topic_filters = None
	if topics:
		topic_filters = [t.strip().lower() for t in topics.split(",") if t.strip()]

	items: List[NewsItem] = []
	for source in INDIAN_RSS_SOURCES:
		try:
			feed = feedparser.parse(source["url"])  # network call; may fail in restricted env
		except Exception:
			continue

		for entry in feed.entries[: max(3, limit)]:
			title = _coalesce(getattr(entry, "title", None)) or "Untitled"
			link = _coalesce(getattr(entry, "link", None)) or "https://example.com"
			summary = _coalesce(
				getattr(entry, "summary", None),
				getattr(entry, "description", None),
			)
			content = summary
			published = _coalesce(getattr(entry, "published", None))
			if published is None and getattr(entry, "published_parsed", None):
				try:
					published = datetime(*entry.published_parsed[:6]).isoformat()
				except Exception:
					published = None

			candidate = NewsItem(
				id=stable_id(f"{title}-{link}"),
				title=title,
				link=link,
				source=SourceMeta(name=source["name"], url=source["url"]),
				published=published,
				content=content,
			)

			if topic_filters:
				text = f"{candidate.title} {candidate.content or ''}".lower()
				if not any(t in text for t in topic_filters):
					continue

			items.append(candidate)

			if len(items) >= limit:
				return items

	# Fallback: if feeds empty, return a demo item
	if not items:
		items.append(
			NewsItem(
				id=stable_id("demo-item"),
				title="Parliament passes key economic reform bill",
				link="https://example.com/demo",
				source=SourceMeta(name="Demo Source", url="https://example.com"),
				published=datetime.utcnow().isoformat(),
				content=(
					"India's Parliament passed a significant economic reform bill aimed at simplifying regulations "
					"and improving ease of doing business across states."
				),
			)
		)

	return items

