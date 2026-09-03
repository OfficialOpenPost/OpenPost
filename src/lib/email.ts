/**
 * Transactional email service abstraction.
 * Supports Resend (via REST API) or local development no-op fallback.
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = options.from || process.env.EMAIL_FROM_ADDRESS || "OpenPost <noreply@openpost.app>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Email Mock] To: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
      console.log(`[Email Mock] Subject: ${options.subject}`);
      console.log(`[Email Mock] Body:\n${options.text || options.html}`);
    } else {
      console.warn("[Email] RESEND_API_KEY is not configured; email sending skipped.");
    }
    return { success: true, id: "mock-email-id" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(`[Email] Resend API error (${res.status}):`, errorText);
      return { success: false };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[Email] Failed to send email:", err?.message || err);
    return { success: false };
  }
}
