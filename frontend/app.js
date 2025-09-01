const apiBase = location.origin.replace(/\/$/, '') + '/api';

function biasClass(label) {
	const v = (label || '').toLowerCase();
	if (v.includes('left')) return 'left';
	if (v.includes('right')) return 'right';
	if (v.includes('center')) return 'center';
	return '';
}

async function fetchNews() {
	const mode = document.getElementById('mode').value;
	const language = document.getElementById('language').value;
	const topics = document.getElementById('topics').value.trim();
	const url = new URL(apiBase + '/news');
	url.searchParams.set('mode', mode);
	url.searchParams.set('language', language);
	if (topics) url.searchParams.set('topics', topics);

	const res = await fetch(url.toString());
	if (!res.ok) throw new Error('Failed to fetch news');
	return res.json();
}

function cardHtml(item) {
	const p = item;
	const biasLbl = p.bias?.label || 'Unknown';
	const biasCls = biasClass(biasLbl);
	const src = p.item.source?.name || 'Source';
	const factSources = p.fact_check?.sources || [];
	const listen = p.listen_url;
	const slides = p.slide_urls || [];
	const agents = p.agents || {};
	const verifier = agents.verifier || null;
	const context = agents.context || null;
	const analysis = agents.analysis || null;
	const impact = agents.impact || null;

	return `
		<div class="card">
			<div class="title"><a href="${p.item.link}" target="_blank" rel="noopener">${p.item.title}</a></div>
			<div class="meta">
				<span>${src}</span>
				<span class="bias ${biasCls}">${biasLbl}</span>
			</div>
			<div class="summary">${p.summary}</div>
			${verifier ? `<div class="summary"><strong>Verifier:</strong> ${verifier.insight} (${Math.round((verifier.confidence||0)*100)}%)</div>` : ''}
			${context ? `<div class="summary"><strong>Context:</strong> ${context.insight}</div>` : ''}
			${analysis ? `<div class="summary"><strong>Analysis:</strong> ${analysis.insight}</div>` : ''}
			${impact ? `<div class="summary"><strong>Impact:</strong> ${impact.insight}</div>` : ''}
			<div class="actions">
				${listen ? `<audio controls src="${listen}"></audio>` : ''}
			</div>
			${slides.length ? `<div class="slides">${slides.map(u => `<img src="${u}" />`).join('')}</div>` : ''}
			<div class="sources">
				${factSources.map(s => `<a class="source" href="${s.url}" target="_blank" rel="noopener">${s.title}</a>`).join('')}
			</div>
		</div>
	`;
}

async function render() {
	const feed = document.getElementById('feed');
	feed.innerHTML = '<div class="card">Loading…</div>';
	try {
		const data = await fetchNews();
		feed.innerHTML = data.map(cardHtml).join('');
	} catch (e) {
		feed.innerHTML = `<div class="card">${e.message}. Is the backend running on ${apiBase}?</div>`;
	}
}

document.getElementById('load').addEventListener('click', render);
window.addEventListener('DOMContentLoaded', render);

