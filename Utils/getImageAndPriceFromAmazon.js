const fetch = require("node-fetch");

const getImageAndPriceFromAmazon = async keywords => {
	const url = `https://www.amazon.com/s?k=${keywords.replace(/\s/g, "+")}&i=digital-text`;

	const response = await fetch(url, {
		headers: {
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
		},
	});
	const fullResponse = await response.text();

	let allImageLinks = fullResponse
		.toString()
		.match(/MAIN-SEARCH_RESULTS-[0-9]([\s\S]*?)<img.*?>/g)[0] //Entire Product
		.match(/srcset=\".*?>/g)[0] //Just the image links
		.match(/https.*?[,|"]/g); //Match all links from srcset
	let highestResolutionImageLink = allImageLinks[allImageLinks.length - 1];
	highestResolutionImageLink = highestResolutionImageLink.replace(/\s.*/, "");

	const productForPrice = fullResponse.toString().match(/MAIN-SEARCH_RESULTS-[0-9]([\s\S]*?)<span class="a-offscreen">([\s\S]*?)<\/span>/)[0];
	const productIntermForPrice = productForPrice.match(/<span class="a-offscreen">([\s\S]*?)<\/span>/)[0];
	const price = productIntermForPrice.replace(/[^0-9\.]/g, "");
	return { imageUrl: highestResolutionImageLink, price };
};

module.exports = getImageAndPriceFromAmazon;
