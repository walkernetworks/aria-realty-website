// Lead notification email via the Resend HTTP API.
// Zero dependencies — uses Node 18+ built-in fetch, same approach as sync/resoClient.js.
//
// Configure in .env (see .env.example):
//   RESEND_API_KEY   re_...  from resend.com → API Keys
//   LEAD_EMAIL_TO    where leads are delivered (comma-separated for several)
//   LEAD_EMAIL_FROM  must be on a domain verified in Resend
//
// If RESEND_API_KEY or LEAD_EMAIL_TO is missing, configured() is false and the
// server silently skips sending. Leads are always written to leads.jsonl first,
// so nothing is lost when email is unconfigured or the API is down.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const TIMEOUT_MS = 10000;

function configured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.LEAD_EMAIL_TO);
}

// Lead fields are attacker-controlled free text. Escape before interpolating
// into the HTML body so a submitted "<script>" or stray "<" can't break it.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function subjectFor(lead) {
  const who = lead.name || 'Someone';
  return lead.listingKey
    ? `Showing request from ${who} — listing ${lead.listingKey}`
    : `New website enquiry from ${who}`;
}

function textBody(lead) {
  const rows = [
    ['Name', lead.name],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Listing', lead.listingKey],
    ['Received', lead.receivedAt],
  ].filter(([, v]) => v);
  return (
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nMessage:\n${lead.message || '(none)'}\n\n— Sent by the Aria Realty website\n`
  );
}

function htmlBody(lead) {
  const rows = [
    ['Name', esc(lead.name)],
    ['Email', lead.email ? `<a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>` : ''],
    ['Phone', lead.phone ? `<a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>` : ''],
    ['Listing', esc(lead.listingKey)],
    ['Received', esc(lead.receivedAt)],
  ].filter(([, v]) => v);

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;color:#12233c;">
  <h2 style="font-family:Georgia,serif;color:#0b1626;margin:0 0 16px;">${esc(subjectFor(lead))}</h2>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:5px 18px 5px 0;color:#5d6b80;">${k}</td><td style="padding:5px 0;">${v}</td></tr>`
      )
      .join('\n    ')}
  </table>
  <div style="padding:14px 18px;background:#f4f6fa;border-left:3px solid #c9a35c;white-space:pre-wrap;">${
    esc(lead.message) || '<i style="color:#5d6b80;">(no message)</i>'
  }</div>
  <p style="color:#5d6b80;font-size:13px;margin-top:22px;">Sent by the Aria Realty Inc. website.</p>
</div>`;
}

// Resolves on success, rejects with an Error on any failure.
async function sendLead(lead) {
  if (!configured()) throw new Error('Email is not configured (RESEND_API_KEY / LEAD_EMAIL_TO)');

  const payload = {
    from: process.env.LEAD_EMAIL_FROM || 'Aria Realty Website <onboarding@resend.dev>',
    to: process.env.LEAD_EMAIL_TO.split(',').map((s) => s.trim()).filter(Boolean),
    subject: subjectFor(lead),
    text: textBody(lead),
    html: htmlBody(lead),
  };
  // So Tahir can hit Reply and land in the client's inbox directly.
  if (lead.email) payload.reply_to = lead.email;

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

module.exports = { configured, sendLead };
