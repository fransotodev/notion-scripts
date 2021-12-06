const { Client } = require("@notionhq/client");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_INTEGRATION_KEY });
const originDatabaseId = process.env.NOTION_ORIGIN_DATABASE_ID;
const destinationDatabaseId = process.env.NOTION_DESTINATION_DATABASE_ID;

(async () => {
	let promises = [];
	let cursor = undefined;

	try {
		while (true) {
			const DATABASE_QUERY = {
				database_id: originDatabaseId,
				start_cursor: cursor,
				sorts: [
					{
						property: "Date",
						direction: "ascending",
					},
				],
			};

			const { results, next_cursor } = await notion.databases.query(
				DATABASE_QUERY
			);

			//This: (1) Returns a promise (2) This promise consists on setTimeout Function (3) setTimeout calls resolve() after n ms
			await new Promise(resolve => setTimeout(resolve, 300)); //To avoid rate_limit in Notion's API

			currentItem = { Date: { date: { start: undefined } } };

			//Creating and inserting the merged item "on the go". Since the results of the query are sorted, no need to save all results in memory
			for (item of results) {
				let itemDate = item.properties.Date.date.start;
				let CURRENT_ITEM_DATE = currentItem.Date.date.start;

				if (itemDate != CURRENT_ITEM_DATE) {
					if (CURRENT_ITEM_DATE != undefined) {
						//1. Make API call to save it
						promises.push(insertItem(currentItem));
					}
					currentItem = { Date: { date: { start: itemDate } } };
				}

				//2. prepare next currentItem
				for (property of Object.keys(item.properties)) {
					const HAS_RICH_TEXT =
						item.properties[property].rich_text != undefined &&
						item.properties[property].rich_text.length != 0;

					const HAS_MULTI_SELECT =
						item.properties[property].multi_select != undefined &&
						item.properties[property].multi_select.length != 0;

					if (HAS_RICH_TEXT) {
						currentItem[property] = {
							rich_text: [
								{
									type: "text",
									text: {
										content:
											item.properties[property].rich_text[0].text.content,
									},
								},
							],
						};
					}

					if (HAS_MULTI_SELECT) {
						currentItem[property] = {
							...currentItem[property],
							multi_select: [],
						};

						item.properties[property].multi_select.forEach(
							multi_select_item => {
								currentItem[property].multi_select.push({
									name: multi_select_item.name,
								});
							}
						);
					}
				}
			}

			cursor = next_cursor;
			if (!next_cursor) {
				promises.push(insertItem(currentItem)); //Last item
				break; //Break the while true loop
			}
		}
	} catch (error) {
		console.error(error);
	}
	console.log("Finishing creation of records in database");
	await Promise.all(promises);
})();

async function insertItem(properties) {
	return notion.pages.create({
		parent: { database_id: destinationDatabaseId },
		properties: properties,
	});
}
