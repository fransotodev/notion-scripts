const { Client } = require("@notionhq/client");
require("dotenv").config();
const getImageAndPriceFromAmazon = require("../Utils/getImageAndPriceFromAmazon");
const blockHasAnyChildrenWithImageContent = require("../Utils/blockHasAnyChildrenWithImageContent");
const setImage = require("../Utils/setImage");
const setPrice = require("../Utils/setPrice");
const notion = new Client({ auth: process.env.NOTION_IMAGE_BY_TITLE_KEY });
const databaseId = process.env.NOTION_MASTER_CONTENT_DATABASE_ID;
const args = process.argv.slice(2);

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
	let pendingPromises = [];
	let exit = false;
	try {
		let current_cursor = undefined;
		while (!exit) {
			let { results, next_cursor } = await notion.databases.query({
				database_id: databaseId,
				start_cursor: current_cursor,
				filter: booksFilter,
				sorts: booksSort,
			});

			for (page of results) {
				try {
					let bookTitle = page.properties.Name.title[0]?.text.content;

					let blockChildren = await notion.blocks.children.list({
						block_id: page.id,
					});
					if (!blockHasAnyChildrenWithImageContent(blockChildren)) {
						let additionalQuery =
							page.properties["Book Filter"].select.name === "Ficción"
								? "+hardcover"
								: "";

						let { imageLink, price } = await getImageAndPriceFromAmazon(
							`${bookTitle}${additionalQuery}`
						);

						console.log(imageLink, " - > ", price);

						//Set image
						pendingPromises.push(setImage(notion, page.id, imageLink));

						//Sleep
						await new Promise(resolve => setTimeout(resolve, 1000));

						//Set Price
						pendingPromises.push(setPrice(notion, page.id, price));
					} else {
						if (args && args[0] === "new") {
							exit = 1;
							break;
						}
					}
				} catch (error) {
					console.error(
						"Invalid ",
						page.properties.Name.title[0]?.text.content,
						" ",
						error
					);
				}
			}
			if (!next_cursor || exit) break; //No more elements in database
			current_cursor = next_cursor;
		}
	} catch (e) {
		console.error(e);
	}

	Promise.all(pendingPromises);
	console.log("Script Finished");
})();
