{
	"translatorID": "543e3b72-cb88-45ee-b1a0-425df499b3a7",
	"label": "Sporza",
	"creator": "Vera de Kok",
	"target": "^https?://(www\\.)?sporza\\.be/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-11-15 21:54:16"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2026 Vera de Kok

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


// /nl/2026/11/15/<slug>~1794760154712/
const ARTICLE_RE = /^https?:\/\/(?:www\.)?sporza\.be\/[a-z]{2}\/\d{4}\/\d{2}\/\d{2}\/[^/?#]+~\d+/;


function detectWeb(doc, url) {
	if (ARTICLE_RE.test(url)) {
		return 'newspaperArticle';
	}
	else if (getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
}


function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('a[href*="~"]');
	for (let row of rows) {
		let href = row.href.replace(/[?#].*$/, '');
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title || !ARTICLE_RE.test(href) || items[href]) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}


async function doWeb(doc, url) {
	if (detectWeb(doc, url) == 'multiple') {
		let items = await Zotero.selectItems(getSearchResults(doc, false));
		if (!items) return;
		for (let url of Object.keys(items)) {
			await scrape(await requestDocument(url));
		}
	}
	else {
		await scrape(doc, url);
	}
}


function getArticleJSONLD(doc) {
	for (let script of doc.querySelectorAll('script[type="application/ld+json"]')) {
		let data;
		try {
			data = JSON.parse(script.textContent);
		}
		catch (e) {
			continue;
		}
		let nodes = Array.isArray(data) ? data : (data['@graph'] || [data]);
		for (let node of nodes) {
			let types = [].concat((node && node['@type']) || []);
			if (types.some(t => /Article$/.test(t))) return node;
		}
	}
	return null;
}


// A capitalised Flemish particle is part of the surname ("Sam De Kegel" -> "De Kegel");
// lowercase Dutch particles ("Mathieu van der Poel") keep ZU.cleanAuthor's default.
const FLEMISH_SURNAME_RE = /^(.+?)\s+((?:Van|Vande|Vanden|Vander|De|Den|Der|Ter|Ten|Te|Op|Le|La|Du|Des|D')(?:\s+(?:de|den|der|het|t|'t))?\s+\S+)$/;

function cleanFlemishAuthor(name) {
	let m = FLEMISH_SURNAME_RE.exec(name);
	if (m) {
		return { firstName: m[1], lastName: m[2], creatorType: 'author' };
	}
	return ZU.cleanAuthor(name, 'author');
}


async function scrape(doc, url = doc.location.href) {
	let json = getArticleJSONLD(doc);

	let translator = Zotero.loadTranslator('web');
	translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48'); // Embedded Metadata
	translator.setDocument(doc);
	translator.setHandler('itemDone', (_obj, item) => {
		item.itemType = 'newspaperArticle';

		let title = (json && json.headline) || item.title || '';
		item.title = ZU.unescapeHTML(title.replace(/\s*\|\s*Sporza\s*$/i, ''));

		// Reporters are only in the visible byline ("Auteur(s): Kelvin Pincé, Rutger Vanseveren");
		// meta article:author is the Facebook page and the JSON-LD author is the organisation.
		item.creators = [];
		let seen = new Set();
		for (let author of doc.querySelectorAll('.sw-article-authors [class*="_author_"]')) {
			let name = ZU.trimInternal(author.textContent);
			if (!name || seen.has(name.toLowerCase())) continue;
			seen.add(name.toLowerCase());
			item.creators.push(cleanFlemishAuthor(name));
		}
		if (!item.creators.length) {
			item.creators.push({ lastName: 'Sporza', creatorType: 'author', fieldMode: 1 });
		}

		let published = (json && json.datePublished)
			|| attr(doc, 'meta[property="article:published_time"]', 'content');
		if (published) {
			item.date = ZU.strToISO(published);
		}

		item.publicationTitle = 'Sporza';
		if (json && typeof json.articleSection == 'string') {
			item.section = json.articleSection;
		}
		item.language = attr(doc, 'html', 'lang') || 'nl';
		item.url = attr(doc, 'link[rel="canonical"]', 'href') || url;

		item.tags = [];
		let tags = new Set();
		for (let tag of doc.querySelectorAll('.sw-article-tags a')) {
			let value = ZU.trimInternal(tag.textContent);
			if (value && !tags.has(value.toLowerCase())) {
				tags.add(value.toLowerCase());
				item.tags.push({ tag: value });
			}
		}

		delete item.publisher;
		delete item.websiteTitle;
		item.complete();
	});
	await translator.translate();
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://sporza.be/nl/2026/11/15/-kan-me-niet-herinneren-wanneer-ik-nog-zo-diep-ging-thibau-nys-hijgt-stevig-na-3e-triomf-waarin-hij-nooit-zijn-draai-vond~1794755827930/",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "\"Kan me niet herinneren wanneer ik nog zó diep ging\": Thibau Nys hijgt stevig na 3e triomf waarin hij nooit zijn draai vond",
				"creators": [
					{
						"firstName": "Kelvin",
						"lastName": "Pincé",
						"creatorType": "author"
					},
					{
						"firstName": "Rutger",
						"lastName": "Vanseveren",
						"creatorType": "author"
					}
				],
				"date": "2026-11-15",
				"abstractNote": "Diep, dieper, Thibau Nys in de Bollekescross. De kersverse Europese kampioen heeft zichzelf na een moeizame race dubbel moeten plooien om zijn perfecte rapport overeind te houden in het veld. Nys geeft dan ook hijgend toe dat hij \"écht kapot\" is na de felle strijd tot op de streep. \"Ik weet niet waar ik die nog gehaald heb, want ik denk niet dat ik er nog echt in geloofde\", aldus de man die opnieuw het spoor volgt van zijn vader op de erelijst.",
				"language": "nl",
				"libraryCatalog": "sporza.be",
				"publicationTitle": "Sporza",
				"section": "veldrijden",
				"shortTitle": "\"Kan me niet herinneren wanneer ik nog zó diep ging\"",
				"url": "https://sporza.be/nl/2026/11/15/-kan-me-niet-herinneren-wanneer-ik-nog-zo-diep-ging-thibau-nys-hijgt-stevig-na-3e-triomf-waarin-hij-nooit-zijn-draai-vond~1794755827930/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Thibau Nys"
					},
					{
						"tag": "X²O Trofee"
					},
					{
						"tag": "veldrijden"
					},
					{
						"tag": "wielrennen"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://sporza.be/nl/2026/11/15/een-miljoen-keer-ja-mathieu-van-der-poel-vraagt-partner-roxan~1794760154712/",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "\"Een miljoen keer ja\": Mathieu van der Poel vraagt partner Roxanne vlak voor gezinsuitbreiding ten huwelijk",
				"creators": [
					{
						"firstName": "Kelvin",
						"lastName": "Pincé",
						"creatorType": "author"
					}
				],
				"date": "2026-11-15",
				"abstractNote": "Alweer heuglijk nieuws voor de familie Van der Poel. Mathieu heeft zijn partner Roxanne Bertels ten huwelijk gevraagd. Het koppel verwacht in januari 2027 een kindje. Vlak voor de gezinsuitbreiding ging het wielerfenomeen op één knie. \"Een miljoen keer ja\", deelde het gelukkige duo bij een aankondiging op Instagram.",
				"language": "nl",
				"libraryCatalog": "sporza.be",
				"publicationTitle": "Sporza",
				"section": "Opvallend",
				"shortTitle": "\"Een miljoen keer ja\"",
				"url": "https://sporza.be/nl/2026/11/15/een-miljoen-keer-ja-mathieu-van-der-poel-vraagt-partner-roxan~1794760154712/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [
					{
						"tag": "Mathieu van der Poel"
					},
					{
						"tag": "Opvallend"
					},
					{
						"tag": "wielrennen"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://sporza.be/nl/",
		"items": "multiple"
	}
]
/** END TEST CASES **/
