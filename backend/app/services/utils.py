import re
import hashlib
from typing import List


_STOPWORDS = {
	"the",
	"a",
	"an",
	"and",
	"or",
	"but",
	"if",
	"while",
	"with",
	"to",
	"of",
	"in",
	"on",
	"for",
	"by",
	"is",
	"are",
	"was",
	"were",
	"be",
	"this",
	"that",
	"it",
	"as",
	"from",
	"at",
	"has",
	"have",
	"had",
	"will",
	"would",
	"can",
	"could",
	"should",
	"may",
	"might",
}


def simple_sentence_split(text: str) -> List[str]:
	parts = re.split(r"(?<=[.!?])\s+", text.strip())
	return [p.strip() for p in parts if p.strip()]


def simple_summarize(text: str, max_sentences: int = 3) -> str:
	if not text:
		return ""
	# Extremely lightweight frequency-based summarizer
	sentences = simple_sentence_split(text)
	if len(sentences) <= max_sentences:
		return " ".join(sentences)

	word_freq = {}
	for sentence in sentences:
		words = re.findall(r"[A-Za-z']+", sentence.lower())
		for word in words:
			if word in _STOPWORDS or len(word) <= 2:
				continue
			word_freq[word] = word_freq.get(word, 0) + 1

	scores = []
	for idx, sentence in enumerate(sentences):
		words = re.findall(r"[A-Za-z']+", sentence.lower())
		score = sum(word_freq.get(w, 0) for w in words)
		scores.append((score, idx, sentence))

	# Pick top sentences by score, keep original order
	top = sorted(scores, key=lambda x: (-x[0], x[1]))[:max_sentences]
	ordered = [s for _, _, s in sorted(top, key=lambda x: x[1])]
	return " ".join(ordered)


def slugify(value: str) -> str:
	value = re.sub(r"[^a-zA-Z0-9_-]+", "-", value.strip())
	value = re.sub(r"-+", "-", value).strip("-")
	return value or "item"


def stable_id(value: str) -> str:
	return hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]

