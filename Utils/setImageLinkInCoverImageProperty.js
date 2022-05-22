const setImageLinkInCoverImageProperty = (notion, propertyName, pageId, imageUrl) => {
	return notion.pages.update({
		page_id: pageId,
		properties: {
			[propertyName]: {
				files: [
					{
						type: "external",
						name: "Space Wallpaper",
						external: {
							url: imageUrl,
						},
					},
				],
			},
		},
	});
};
module.exports = setImageLinkInCoverImageProperty;
