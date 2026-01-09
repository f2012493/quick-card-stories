from typing import List

try:
	from duckduckgo_search import DDGS
except Exception:  # pragma: no cover
	DDGS = None

from ..schemas import FactCheckResult, FactSource


def _search_web(query: str, max_results: int = 3) -> List[FactSource]:
	results: List[FactSource] = []
	if DDGS is None:
		return results
	try:
		with DDGS() as ddgs:
			for r in ddgs.text(query, region="in-en", safesearch="moderate", max_results=max_results):
				url = r.get("href") or r.get("link") or r.get("url")
				title = r.get("title") or r.get("heading") or "Source"
				snippet = r.get("body") or r.get("snippet")
				if url:
					results.append(FactSource(title=title, url=url, snippet=snippet))
	except Exception:
		return results
	return results


def fact_check_text(claim: str) -> FactCheckResult:
	query = f"site:indiatoday.in OR site:timesofindia.indiatimes.com OR site:thehindu.com fact check {claim}"
	sources = _search_web(query, max_results=4)
	if not sources:
		# broaden search
		sources = _search_web(claim, max_results=3)

	confidence = min(0.95, 0.3 + 0.2 * len(sources))
	summary = (
		"Automated initial fact scan completed. Verify details by visiting the linked sources."
	)
	return FactCheckResult(confidence=confidence, summary=summary, sources=sources)

