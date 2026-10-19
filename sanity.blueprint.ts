import { defineBlueprint, defineSyncTagInvalidateFunction } from "@sanity/blueprints";

// Deployment must select the dataset explicitly; never default a stack to production.
const dataset = process.env.SANITY_FUNCTION_DATASET;
if (dataset !== "staging" && dataset !== "production") {
  throw new Error("Set SANITY_FUNCTION_DATASET to staging or production");
}

export default defineBlueprint({
  resources: [
    defineSyncTagInvalidateFunction({
      name: "invalidate-tags",
      src: "functions/invalidate-tags",
      runtime: "nodejs24.x",
      timeout: 30,
      event: { resource: { type: "dataset", id: `e07b8hy0.${dataset}` } },
    }),
  ],
});
