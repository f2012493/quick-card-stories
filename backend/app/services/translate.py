from typing import Optional

try:
	from deep_translator import GoogleTranslator
except Exception:  # pragma: no cover - optional in restricted env
	GoogleTranslator = None


def translate_text(text: str, target_language: str = "en", source_language: Optional[str] = None) -> str:
	if not text:
		return ""
	if target_language.lower() == "en" and (source_language is None or source_language.lower() == "en"):
		return text
	if GoogleTranslator is None:
		return text
	try:
		translator = GoogleTranslator(source=source_language or "auto", target=target_language)
		return translator.translate(text)
	except Exception:
		return text

