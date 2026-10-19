import { syncTagInvalidateEventHandler } from "@sanity/functions";
import { invalidateSyncTags } from "./handler";

export const handler = syncTagInvalidateEventHandler(async ({ event, done }) => {
  await invalidateSyncTags({ tags: event.data.syncTags, done });
});
