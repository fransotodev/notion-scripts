const setPrice = (notion, pageId, price) => {
	return notion.pages.update({
		page_id: pageId,
		properties: {
			Price: {
				number: parseFloat(price),
			},
		},
	});
};
module.exports = setPrice;
