import { Resend } from "resend";

let resend: Resend | undefined;

function getResend() {
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export const POST = async (request: Request) => {
  const { email } = await request.json();

  // Create contact
  try {
    await getResend().contacts.create({
      email,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Error subscribing to updates" },
      { status: 400 }
    );
  }
};
