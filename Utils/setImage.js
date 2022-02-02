const setImage = (notion, pageId, imageLink) => {
	return notion.blocks.children.append({
		block_id: pageId,
		children: [
			{
				object: "block",
				type: "image",
				image: {
					type: "external",
					external: {
						url: imageLink,
					},
				},
			},
		],
	});
};
module.exports = setImage;
