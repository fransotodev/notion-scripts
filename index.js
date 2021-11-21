const { Client } = require("@notionhq/client");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_INTEGRATION_KEY });
const originDatabaseId = process.env.NOTION_ORIGIN_DATABASE_ID;
const destinationDatabaseId = process.env.NOTION_DESTINATION_DATABASE_ID;

let allHabits = [];
let newAllHabits = {};

async function readItems() {
	let cursor = undefined;

	try {
		while (true) {
			const { results, next_cursor } = await notion.databases.query({
				database_id: originDatabaseId,
				start_cursor: cursor,
				sorts: [
					{
						property: "Date",
						direction: "ascending",
					},
				],
			});

			//TODO: Process the data here, instead of storing in a big array in memory
			allHabits.push(...results);
			console.log(next_cursor);
			cursor = next_cursor;
			if (!next_cursor) {
				break;
			}
		}
	} catch (error) {
		console.error(error);
	}
}

//Merge in newAllHabits all the items by date
async function combineItems() {
	allHabits.forEach(item => {
		if (newAllHabits[item.properties.Date.date.start]) {
			newAllHabits[item.properties.Date.date.start].push(item.properties);
		} else {
			newAllHabits[item.properties.Date.date.start] = [item.properties];
		}
	});

	let dates = Object.keys(newAllHabits);
	for (date of dates) {
		let newItem = {};

		newAllHabits[date].forEach(item => {
			Object.keys(item).forEach(property => {
				if (
					(item[property].rich_text != undefined &&
						item[property].rich_text.length != 0) ||
					(item[property].multi_select != undefined &&
						item[property].multi_select.length != 0)
				) {
					if (date == "2021-09-04") {
						console.log(item[property]);
					}

					newItem[property] =
						item[property].rich_text != undefined
							? {
									rich_text: [
										{
											type: "text",
											text: {
												content: item[property].rich_text[0].text.content,
											},
										},
									],
							  }
							: {
									multi_select: [],
							  };
					if (item[property].multi_select != undefined) {
						item[property].multi_select.forEach(multi_select_item => {
							newItem[property].multi_select.push({
								name: multi_select_item.name,
							});
						});
					}
				}
			});
		});
		newAllHabits[date] = { ...newItem, Date: { date: { start: date } } };
	}

	// console.log(newAllHabits["2021-09-04"]["Type Training"]);
}

async function insertion() {
	Object.keys(newAllHabits).forEach(async key => {
		try {
			const response = await notion.pages.create({
				parent: { database_id: destinationDatabaseId },
				properties: newAllHabits[key],
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
