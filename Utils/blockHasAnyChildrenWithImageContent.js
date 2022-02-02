const blockHasAnyChildrenWithImageContent = contents => {
	for (block of contents.results) {
		if (block.type === "image") {
			return true;
		}
	}
	return false;
};

module.exports = blockHasAnyChildrenWithImageContent;
