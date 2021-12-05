const { Client } = require("@notionhq/client");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_INTEGRATION_KEY });
const originDatabaseId = process.env.NOTION_ORIGIN_DATABASE_ID;
const destinationDatabaseId = process.env.NOTION_DESTINATION_DATABASE_ID;

let allHabits = {};

async function readItems() {
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
			const { results, next_cursor } = await notion.databases.query({
				DATABASE_QUERY,
			});
			results.forEach(item => {
				let date = item.properties.Date.date.start;
				console.log(date);
				if (allHabits[date]) {
					allHabits[date].push(item.properties);
				} else {
					allHabits[date] = [item.properties];
				}
			});

			cursor = next_cursor;
			if (!next_cursor) {
				break;
			}
		}
	} catch (error) {
		console.error(error);
	}
}

async function combineItems() {
	let dates = Object.keys(allHabits);
	for (date of dates) {
		let newItem = {};

		allHabits[date].forEach(item => {
			Object.keys(item).forEach(property => {
				const HAS_RICH_TEXT =
					item[property].rich_text != undefined &&
					item[property].rich_text.length != 0;

				const HAS_MULTI_SELECT =
					item[property].multi_select != undefined &&
					item[property].multi_select.length != 0;

				//Building merged item. Adding  rich text
				if (HAS_RICH_TEXT) {
					newItem[property] = {
						rich_text: [
							{
								type: "text",
								text: {
									content: item[property].rich_text[0].text.content,
								},
							},
						],
					};
				}

				//Building merged item. Adding multi_select
				if (HAS_MULTI_SELECT) {
					newItem[property] = { ...newItem[property], multi_select: [] };

					item[property].multi_select.forEach(multi_select_item => {
						newItem[property].multi_select.push({
							name: multi_select_item.name,
						});
					});
				}
			});
		});

		//Transform to Notion API format.
		allHabits[date] = { ...newItem, Date: { date: { start: date } } };
	}

	// console.log(allHabits["2021-09-04"]["Type Training"]);
}

async function insertion() {
	Object.keys(allHabits).forEach(async key => {
		try {
			await notion.pages.create({
				parent: { database_id: destinationDatabaseId },
				properties: allHabits[key],
			});
		} catch (error) {
			console.error(date, " ", error);
		}
		console.log("Successful ", key);
	});
}

(async () => {
	await readItems();
	await combineItems();
	await insertion();
})();
