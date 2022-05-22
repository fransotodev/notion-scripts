const { Client } = require("@notionhq/client");
const getImageAndPriceFromAmazon = require("../Utils/getImageAndPriceFromAmazon");
const setImageLinkInCoverImageProperty = require("../Utils/setImageLinkInCoverImageProperty");
const setPrice = require("../Utils/setPrice");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_IMAGE_BY_TITLE_KEY });
const databaseId = process.env.NOTION_MASTER_CONTENT_DATABASE_ID;
const args = process.argv.slice(2);

const COVER_IMAGE_PROPERTY_NAME = "Cover Image";

const booksFilter = {
	and: [
		{
			property: "Type",
			select: {
				equals: "Libro",
			},
		},
		{
			property: "Finished",
			checkbox: {
				equals: true,
			},
		},
	],
};

const booksSort = [
	{
		property: "Date",
		direction: "descending",
	},
];

(async () => {
	const pendingPromises = [];
	let exit = false;

	let current_cursor = undefined;
	while (!exit) {
		const { results, next_cursor } = await notion.databases.query({
			database_id: databaseId,
			start_cursor: current_cursor,
			filter: booksFilter,
			sorts: booksSort,
		});

		for (page of results) {
			try {
				const bookCoverImageObject = page.properties["Cover Image"];
				const bookHasCoverImage = bookCoverImageObject.files.length !== 0;

				if (!bookHasCoverImage) {
					const bookTitle = page.properties.Name.title[0]?.text.content;
					const additionalQuery = page.properties["Book Filter"].select.name === "Ficción" ? "+hardcover" : "";

					const { imageUrl, price } = await getImageAndPriceFromAmazon(`${bookTitle}${additionalQuery}`);

					console.log(imageUrl, " - > ", price);

					pendingPromises.push(setImageLinkInCoverImageProperty(notion, COVER_IMAGE_PROPERTY_NAME, page.id, imageUrl));

					await new Promise(resolve => setTimeout(resolve, 750)); //Avoid Notion's API throttling

					pendingPromises.push(setPrice(notion, page.id, price));
				} else {
					if (args && args[0] === "new") {
						exit = true;
						break;
					}
				}
			} catch (error) {
				console.error("Error at book: ", page.properties.Name.title[0]?.text.content, " ", error);
			}
		}
		if (!next_cursor || exit) break; //No more elements in database
		current_cursor = next_cursor;
	}
	Promise.all(pendingPromises);
})();
