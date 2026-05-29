import { z } from "zod";

type TemplateKey = "contact" | "quote" | "support";

const templateKeySchema = z.enum(["contact", "quote", "support"]);

const payloadSchema = z.object({
  templateKey: templateKeySchema,
  formName: z.string().trim().min(1).max(80),
  pagePath: z.string().trim().max(500).optional().default(""),
  fields: z.record(z.string(), z.string().trim().max(2000)),
  botField: z.string().max(500).optional().default(""),
});

const TEMPLATE_ID_BY_KEY: Record<TemplateKey, string | undefined> = {
  contact: process.env.EMAILJS_TEMPLATE_CONTACT,
  quote: process.env.EMAILJS_TEMPLATE_QUOTE,
  support: process.env.EMAILJS_TEMPLATE_SUPPORT,
};

const RATE_LIMIT_WINDOW_MS = 1200;
const lastRequestByIp = new Map<string, number>();

function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const [firstIp] = xForwardedFor.split(",");
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export const POST = async (request: Request) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: "Invalid form payload" }, { status: 400 });
  }

  const { templateKey, formName, pagePath, fields, botField } = parsed.data;

  if (botField.trim().length > 0) {
    return Response.json({ success: true });
  }

  const clientIp = getClientIp(request);
  const now = Date.now();
  const lastRequestAt = lastRequestByIp.get(clientIp);

  if (lastRequestAt && now - lastRequestAt < RATE_LIMIT_WINDOW_MS) {
    return Response.json(
      { error: "Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  lastRequestByIp.set(clientIp, now);

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const templateId = TEMPLATE_ID_BY_KEY[templateKey];

  if (!serviceId || !publicKey || !templateId) {
    return Response.json(
      { error: "Email service is not configured." },
      { status: 500 }
    );
  }

  const allFields = Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const body: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      ...fields,
      form_name: formName,
      page_path: pagePath || "unknown",
      submitted_at: new Date().toISOString(),
      all_fields: allFields || "No fields submitted",
    },
  };

  if (privateKey) {
    body.accessToken = privateKey;
  }

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("EmailJS API error", response.status, errorText);

      return Response.json(
        { error: "Unable to send email at the moment." },
        { status: 502 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Unable to send email at the moment." },
      { status: 502 }
    );
  }
};
