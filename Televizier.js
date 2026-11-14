{
	"translatorID": "e5345bf2-9a32-4920-ba39-4f727594eff2",
	"label": "Televizier",
	"creator": "Vera de Kok",
	"target": "^https?://(www\\.)?televizier\\.nl/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-11-14 16:51:12"
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


function detectWeb(doc, _url) {
	if (doc.body.classList.contains('single-post') && doc.querySelector('.nieuws_artikel_content h1')) {
		return 'magazineArticle';
	}
	else if (getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('.post__card--content--title > a[href]');
	for (let row of rows) {
		let href = row.href;
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
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

async function scrape(doc, url = doc.location.href) {
	let translator = Zotero.loadTranslator('web');
	// Embedded Metadata
	translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48');
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		// The <title> carries a " – Televizier" suffix and there is no og:site_name to strip it
		let title = text(doc, '.nieuws_artikel_content h1');
		if (title) item.title = title;
		item.publicationTitle = 'Televizier';
		delete item.websiteTitle;
		delete item.blogTitle;
		item.language = 'nl';

		// The byline is an italic "Tekst: Name" paragraph at the end of the article;
		// partner content and some columns have no credit, and some have an empty "Tekst:"
		item.creators = [];
		for (let em of doc.querySelectorAll('.nieuws_artikel_content p > em')) {
			let match = ZU.trimInternal(em.textContent).match(/^Tekst:\s*(.+)$/i);
			if (!match) continue;
			for (let name of match[1].split(/\s*(?:,|&|\sen\s)\s*/)) {
				// Dutch sorting: particles stay with the first name ("Meer, Maarten van der")
				if (name) item.creators.push(ZU.cleanAuthor(name, 'author'));
			}
		}

		// The italic lead paragraph is the standfirst
		let lead = doc.querySelector('.nieuws_artikel_content h1 + p > em');
		if (lead && !/^Tekst:/i.test(lead.textContent.trim())) {
			item.abstractNote = ZU.trimInternal(lead.textContent);
		}

		// The page shows only today's date, not a publication date, so none is set
		delete item.date;
		item.complete();
	});

	let em = await translator.getTranslatorObject();
	em.itemType = 'magazineArticle';
	await em.doWeb(doc, url);
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.televizier.nl/informatief/van-varsseveld-tot-zuid-korea/",
		"items": [
			{
				"itemType": "magazineArticle",
				"title": "Van Varsseveld tot Zuid-Korea",
				"creators": [
					{
						"firstName": "Richard",
						"lastName": "Roosenboom",
						"creatorType": "author"
					}
				],
				"abstractNote": "Guus Hiddink is de beroemdste Achterhoeker van de wereld. Ter gelegenheid van zijn tachtigste verjaardag verschijnt de documentaire Guus Hiddink: ’t kump good. Alvast een beknopte biografie ter voorbereiding.",
				"language": "nl",
				"libraryCatalog": "www.televizier.nl",
				"publicationTitle": "Televizier",
				"url": "https://www.televizier.nl/informatief/van-varsseveld-tot-zuid-korea/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.televizier.nl/informatief/bob-sikkes-ik-ben-eigenwijs/",
		"items": [
			{
				"itemType": "magazineArticle",
				"title": "Bob Sikkes: ‘Ik ben eigenwijs’",
				"creators": [
					{
						"firstName": "Maarten van der",
						"lastName": "Meer",
						"creatorType": "author"
					}
				],
				"abstractNote": "Bob Sikkes volgt samen met Tijl Beckand in De moeite waard?! kandidaten die een huis verbouwen. Hij blijft zich verbazen over wat hij ziet.",
				"language": "nl",
				"libraryCatalog": "www.televizier.nl",
				"publicationTitle": "Televizier",
				"shortTitle": "Bob Sikkes",
				"url": "https://www.televizier.nl/informatief/bob-sikkes-ik-ben-eigenwijs/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.televizier.nl/informatief/de-nieuwe-alleskunner/",
		"items": [
			{
				"itemType": "magazineArticle",
				"title": "De nieuwe alleskunner",
				"creators": [
					{
						"firstName": "Jef",
						"lastName": "Willemsen",
						"creatorType": "author"
					}
				],
				"abstractNote": "Samen met Monica Geuze presenteert Edson da Graça de kennisquiz die niemand wil winnen: Nederlands domste. Edson zou zelf geen kans maken op die titel. Hij lijkt van alle markten thuis.",
				"language": "nl",
				"libraryCatalog": "www.televizier.nl",
				"publicationTitle": "Televizier",
				"url": "https://www.televizier.nl/informatief/de-nieuwe-alleskunner/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.televizier.nl/partnerbijdrage/wat-beelden-van-een-haartransplantatie-niet-laten-zien/",
		"items": [
			{
				"itemType": "magazineArticle",
				"title": "Wat beelden van een haartransplantatie niet laten zien",
				"creators": [],
				"language": "nl",
				"libraryCatalog": "www.televizier.nl",
				"publicationTitle": "Televizier",
				"url": "https://www.televizier.nl/partnerbijdrage/wat-beelden-van-een-haartransplantatie-niet-laten-zien/",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.televizier.nl/informatief/",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://www.televizier.nl/?s=jansen",
		"items": "multiple"
	}
]
/** END TEST CASES **/
