const fetch = require("node-fetch");

const getImageAndPriceFromAmazon = async keywords => {
	const url = `https://www.amazon.com/s?k=${keywords.replace(
		/\s/g,
		"+"
	)}&i=digital-text`;

	const response = await fetch(url);
	const fullResponse = await response.text();

	let allLinks = fullResponse
		.toString()
		.match(/MAIN-SEARCH_RESULTS-[0-9]([\s\S]*?)<img.*?>/g)[0] //Entire ASIN
		.match(/srcset=\".*?>/g)[0] //Just the image links
		.match(/https.*?[,|"]/g); //Match all links from srcset
	let highestResolutionLink = allLinks[allLinks.length - 1];
	highestResolutionLink = highestResolutionLink.replace(/\s.*/, "");

	const anotherASIN = fullResponse
		.toString()
		.match(
			/MAIN-SEARCH_RESULTS-[0-9]([\s\S]*?)<span class="a-offscreen">([\s\S]*?)<\/span>/
		)[0];
	const another = anotherASIN.match(
		/<span class="a-offscreen">([\s\S]*?)<\/span>/
	)[0];
	const price = another.replace(/[^0-9\.]/g, "");
	return { imageLink: highestResolutionLink, price };
};

const getMethods = obj => {
	let properties = new Set();
	let currentObj = obj;
	do {
		Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
	} while ((currentObj = Object.getPrototypeOf(currentObj)));
	return [...properties.keys()].filter(item => typeof obj[item] === "function");
};

module.exports = getImageAndPriceFromAmazon;
