{
	"translatorID": "ce6c728b-219a-480d-90b3-129aadb6e607",
	"label": "Vlaams Parlement",
	"creator": "Vera de Kok",
	"target": "^https?://(www\\.)?vlaamsparlement\\.be/nl/actueel/nieuws-uit-het-vlaams-parlement/.+",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2026-11-14 15:47:11"
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
	if (doc.querySelector('main.node--news--full h1.page-title')) {
		return 'webpage';
	}
	return false;
}

async function doWeb(doc, url) {
	await scrape(doc, url);
}

async function scrape(doc, url = doc.location.href) {
	let translator = Zotero.loadTranslator('web');
	// Embedded Metadata
	translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48');
	translator.setDocument(doc);

	translator.setHandler('itemDone', (_obj, item) => {
		// <title> ends in " | Vlaams Parlement" and og:title is sometimes truncated;
		// video items start with a play symbol
		let title = text(doc, 'main.node--news--full h1.page-title');
		if (title) item.title = title.replace(/^▶\s*/, '');
		item.websiteTitle = 'Vlaams Parlement';

		// Only the hero date belongs to this item; other <time> elements are related news.
		// Its datetime attribute is malformed ("12 June 2025T14:03:34Z"), so use the date part.
		let time = doc.querySelector('.hero-header-news__date time');
		let date = time && (attr(time, 'datetime').split('T')[0] || time.textContent);
		if (date) item.date = ZU.strToISO(date);

		let lead = text(doc, 'main.node--news--full .field--hero-body');
		if (lead) item.abstractNote = ZU.trimInternal(lead);

		// The site carries no personal bylines; "Van <member>" credits on the page belong to related documents
		item.creators = [];
		item.language = attr(doc, 'html', 'lang') || 'nl';
		item.complete();
	});

	let em = await translator.getTranslatorObject();
	em.itemType = 'webpage';
	await em.doWeb(doc, url);
}

/** BEGIN TEST CASES **/
var testCases = [
]
/** END TEST CASES **/
