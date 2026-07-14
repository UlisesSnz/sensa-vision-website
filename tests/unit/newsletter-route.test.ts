import { beforeEach, describe, expect, it, vi } from "vitest";

const resendMocks = vi.hoisted(() => ({
  constructor: vi.fn(),
  create: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    contacts = { create: resendMocks.create };

    constructor(apiKey: string | undefined) {
      resendMocks.constructor(apiKey);
    }
  },
}));

async function postNewsletter(email = "reader@example.com") {
  const { POST } = await import("@/app/api/newsletter/route");
  return POST(
    new Request("https://sensa.example/api/newsletter", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  );
}

describe("newsletter route", () => {
  beforeEach(() => {
    vi.resetModules();
    resendMocks.constructor.mockReset();
    resendMocks.create.mockReset();
    process.env.RESEND_API_KEY = "test-api-key";
    process.env.RESEND_AUDIENCE_ID = "test-audience";
  });

  it("initializes Resend lazily and awaits contact creation", async () => {
    let resolveCreate: (() => void) | undefined;
    resendMocks.create.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const responsePromise = postNewsletter();
    await vi.waitFor(() => expect(resendMocks.create).toHaveBeenCalledOnce());

    expect(resendMocks.constructor).toHaveBeenCalledWith("test-api-key");
    expect(resendMocks.create).toHaveBeenCalledWith({
      email: "reader@example.com",
      unsubscribed: false,
      audienceId: "test-audience",
    });

    let settled = false;
    void responsePromise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveCreate?.();
    const response = await responsePromise;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns a controlled error when Resend rejects the contact", async () => {
    resendMocks.create.mockRejectedValue(new Error("Resend unavailable"));

    const response = await postNewsletter();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Error subscribing to updates",
    });
  });
});
