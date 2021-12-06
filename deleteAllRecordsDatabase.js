const { Client } = require("@notionhq/client");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_INTEGRATION_KEY });
const destinationDatabaseId = process.env.NOTION_DESTINATION_DATABASE_ID;

(async () => {
	let cursor = undefined;
	let promises = [];
	try {
		while (true) {
			const DATABASE_QUERY = {
				database_id: destinationDatabaseId,
				start_cursor: cursor,
			};

			await new Promise(resolve => setTimeout(resolve, 300)); //To avoid rate_limit in Notion's API

			const { results, next_cursor } = await notion.databases.query(
				DATABASE_QUERY
			);

			for (item of results) {
				promises.push(notion.blocks.delete({ block_id: item.id }));
			}

			cursor = next_cursor;
			if (!next_cursor) {
				break;
			}
		}
		console.log("Completing deletion...");
		await Promise.all(promises);
	} catch (error) {
		console.error(error);
	}
})();
