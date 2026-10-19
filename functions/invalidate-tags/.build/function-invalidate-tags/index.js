import { invalidateSyncTags } from "./index3.js";
import { syncTagInvalidateEventHandler } from "@sanity/functions";
//#region functions/invalidate-tags/index.ts
var handler = syncTagInvalidateEventHandler(async ({ event, done }) => {
	await invalidateSyncTags({
		tags: event.data.syncTags,
		done
	});
});
//#endregion
export { handler };

//# sourceMappingURL=index.js.map