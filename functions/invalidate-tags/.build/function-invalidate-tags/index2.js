//#region lib/sanity-sync-tags.ts
var SANITY_CACHE_TAG_PREFIX = "sanity:";
function parseSyncTags(value) {
	if (!Array.isArray(value) || value.length === 0 || !value.every((tag) => typeof tag === "string" && tag.length > 0 && tag.length <= 249 && !/\s/.test(tag) && !tag.startsWith("sanity:"))) return null;
	return [...new Set(value)];
}
//#endregion
export { SANITY_CACHE_TAG_PREFIX, parseSyncTags };

//# sourceMappingURL=index2.js.map