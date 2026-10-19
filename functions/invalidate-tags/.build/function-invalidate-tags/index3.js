import { parseSyncTags } from "./index2.js";
//#region functions/invalidate-tags/handler.ts
var RequestFailure = class extends Error {
	constructor(status) {
		super(`HTTP ${status}`);
		this.status = status;
	}
};
async function confirmWithTimeout(done) {
	let timer;
	try {
		return await Promise.race([done(), new Promise((_, reject) => {
			timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Confirmation timed out")), 3e3);
		})]);
	} finally {
		clearTimeout(timer);
	}
}
async function retry(operation, stage, dependencies) {
	for (let attempt = 1; attempt <= 3; attempt++) try {
		const response = await operation();
		if (!response.ok) throw new RequestFailure(response.status);
		return response;
	} catch (error) {
		const status = error instanceof RequestFailure ? error.status : 0;
		const transient = status === 0 || status === 429 || status >= 500;
		dependencies.log("sanity.invalidation.attempt_failed", {
			stage,
			attempt,
			status
		});
		if (!transient || attempt === 3) throw new Error(`Sanity invalidation failed at ${stage} (HTTP ${status})`);
		await dependencies.sleep(attempt * 500);
	}
	throw new Error("Unreachable retry state");
}
async function invalidateSyncTags(input, dependencies = {
	env: {
		REVALIDATE_URL: process.env.REVALIDATE_URL,
		REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
		VERCEL_AUTOMATION_BYPASS_SECRET: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
	},
	fetch,
	sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
	log: (message, data) => console.info(message, data)
}) {
	const startedAt = Date.now();
	const tags = parseSyncTags(input.tags);
	const { REVALIDATE_URL, REVALIDATE_SECRET, VERCEL_AUTOMATION_BYPASS_SECRET } = dependencies.env;
	if (!tags) throw new Error("Invalid Content Lake sync tags");
	if (!REVALIDATE_URL || !REVALIDATE_SECRET) throw new Error("Missing REVALIDATE_URL or REVALIDATE_SECRET");
	const url = new URL(REVALIDATE_URL);
	if (url.username || url.password || url.search || url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Invalid revalidation endpoint URL");
	if ((await (await retry(() => dependencies.fetch(url, {
		method: "POST",
		redirect: "error",
		signal: AbortSignal.timeout(5e3),
		headers: {
			authorization: `Bearer ${REVALIDATE_SECRET}`,
			"content-type": "application/json",
			...VERCEL_AUTOMATION_BYPASS_SECRET ? { "x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET } : {}
		},
		body: JSON.stringify({ tags })
	}), "endpoint", dependencies)).json().catch(() => null))?.revalidated !== tags.length) throw new Error("Invalid revalidation acknowledgement");
	await retry(() => confirmWithTimeout(() => input.done(tags)), "done", dependencies);
	dependencies.log("sanity.invalidation.completed", {
		tagCount: tags.length,
		tags: tags.join(","),
		durationMs: Date.now() - startedAt
	});
}
//#endregion
export { invalidateSyncTags };

//# sourceMappingURL=index3.js.map