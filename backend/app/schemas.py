from typing import List, Optional, Literal
from pydantic import BaseModel, HttpUrl


class SourceMeta(BaseModel):
	name: str
	url: Optional[HttpUrl] = None
	bias_label: Optional[str] = None
	reliability: Optional[float] = None  # 0..1 subjective heuristic


class FactSource(BaseModel):
	title: str
	url: HttpUrl
	snippet: Optional[str] = None


class FactCheckResult(BaseModel):
	confidence: float  # 0..1
	summary: str
	sources: List[FactSource]


class BiasMeta(BaseModel):
	label: str  # e.g., Left, Center, Right, Satire, Opinion, Unknown
	score: Optional[float] = None  # -1..1 left/right (if applicable)
	rationale: Optional[str] = None


class NewsItem(BaseModel):
	id: str
	title: str
	link: HttpUrl
	source: SourceMeta
	published: Optional[str] = None
	content: Optional[str] = None
	category: Optional[str] = None


class AgentOutput(BaseModel):
	label: str
	insight: str
	confidence: Optional[float] = None
	sources: Optional[List[FactSource]] = None
	meta: Optional[dict] = None


class AgentsBundle(BaseModel):
	verifier: AgentOutput
	context: AgentOutput
	analysis: AgentOutput
	impact: AgentOutput


class ProcessedNewsItem(BaseModel):
	item: NewsItem
	summary: str
	language: str
	translation_language: Optional[str] = None
	fact_check: FactCheckResult
	bias: BiasMeta
	listen_url: Optional[str] = None
	slide_urls: Optional[List[str]] = None
	mode: Literal["read", "listen", "watch", "multilingual"]
	agents: Optional[AgentsBundle] = None



class TTSRequest(BaseModel):
	text: str
	language: str = "en"


class TTSResponse(BaseModel):
	url: str
	path: str


class SlidesRequest(BaseModel):
	text: str
	language: str = "en"


class SlidesResponse(BaseModel):
	urls: List[str]
	paths: List[str]

