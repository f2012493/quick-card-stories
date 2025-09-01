from ..schemas import BiasMeta


_BIAS_MAP = {
	"ndtv": ("Center-Left", -0.3, "Assessed from editorial stance and external trackers"),
	"the hindu": ("Center-Left", -0.2, "Known for policy-heavy reporting"),
	"times of india": ("Center", 0.0, "Broad mainstream coverage"),
	"republic": ("Right", 0.5, "Editorial tone and source assessments"),
	"opindia": ("Right", 0.7, "Opinion-forward outlet"),
	"the wire": ("Left", -0.6, "Investigative and opinion-heavy"),
	"indian express": ("Center", 0.0, "Balanced reportage reputation"),
	"hindustan times": ("Center", 0.0, "Mainstream metro daily"),
	"aaj tak": ("Center", 0.0, "Hindi broadcast mainstream"),
	"abp": ("Center", 0.0, "Broadcast mainstream"),
	"scroll": ("Left", -0.4, "Long-form, progressive tilt"),
}


def infer_bias_for_source(source_name: str) -> BiasMeta:
	if not source_name:
		return BiasMeta(label="Unknown", score=None, rationale=None)
	key = source_name.strip().lower()
	best_key = None
	for k in _BIAS_MAP.keys():
		if k in key:
			best_key = k
			break
	if best_key is None:
		return BiasMeta(label="Unknown", score=None, rationale=None)
	label, score, rationale = _BIAS_MAP[best_key]
	return BiasMeta(label=label, score=score, rationale=rationale)

