import asyncio
from typing import List

from ..schemas import (
	FactCheckResult,
	FactSource,
	AgentsBundle,
	AgentOutput,
)
from .fact_check import fact_check_text
from .utils import simple_summarize


async def _run_verifier(title: str, body: str) -> AgentOutput:
	loop = asyncio.get_event_loop()
	fact: FactCheckResult = await loop.run_in_executor(None, fact_check_text, title)
	insight = fact.summary
	conf = fact.confidence
	sources = fact.sources
	return AgentOutput(label="Verifier", insight=insight, confidence=conf, sources=sources)


async def _run_context(title: str, body: str) -> AgentOutput:
	# Provide background and why-it-matters using naive heuristics
	text = body or title
	context_lines: List[str] = []
	if any(k in text.lower() for k in ["inflation", "gdp", "budget", "gst", "reform", "economy"]):
		context_lines.append("Economic context: impact on households, businesses, and fiscal policy.")
	if any(k in text.lower() for k in ["election", "parliament", "minister", "supreme court", "bill"]):
		context_lines.append("Governance context: legal and political implications.")
	if any(k in text.lower() for k in ["ipl", "cricket", "hockey", "football"]):
		context_lines.append("Sports context: fan sentiment, league standings, and scheduling.")
	if not context_lines:
		context_lines.append("Background: what led to this development and who is affected.")
	insight = " ".join(context_lines)
	return AgentOutput(label="Context", insight=insight, confidence=0.6)


async def _run_analysis(title: str, body: str) -> AgentOutput:
	# Deeper analysis using a simple summarizer as a stand-in
	text = body or title
	analysis = simple_summarize(text, max_sentences=2)
	if not analysis:
		analysis = text[:200]
	return AgentOutput(label="Analysis", insight=analysis, confidence=0.5)


async def _run_impact(title: str, body: str, user_topics: List[str]) -> AgentOutput:
	# Map to user interest with a naive heuristic
	text = (body or title).lower()
	signals: List[str] = []
	for t in user_topics:
		if t and t.lower() in text:
			signals.append(f"Relevant to your interest: {t}")
	if any(k in text for k in ["jobs", "prices", "tax", "subsidy", "loan"]):
		signals.append("Personal impact: potential effects on cost of living or income.")
	if any(k in text for k in ["education", "exam", "admission", "university"]):
		signals.append("Personal impact: students and parents may need to plan ahead.")
	if not signals:
		signals.append("Impact: what you might do next or watch for.")
	insight = " ".join(signals)
	return AgentOutput(label="Impact", insight=insight, confidence=0.55)


async def run_agents(title: str, body: str, topics_csv: str | None) -> AgentsBundle:
	user_topics: List[str] = [t.strip() for t in (topics_csv or "").split(",") if t.strip()]
	ver_task = asyncio.create_task(_run_verifier(title, body))
	ctx_task = asyncio.create_task(_run_context(title, body))
	ana_task = asyncio.create_task(_run_analysis(title, body))
	imp_task = asyncio.create_task(_run_impact(title, body, user_topics))
	verifier, context, analysis, impact = await asyncio.gather(ver_task, ctx_task, ana_task, imp_task)
	return AgentsBundle(verifier=verifier, context=context, analysis=analysis, impact=impact)

