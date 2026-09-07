import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/leads' && request.method === 'POST') {
      return handleLeadSubmission(request, env);
    }

    // Static assets handled by Wrangler assets binding
    return new Response('Not Found', { status: 404 });
  },
};

async function handleLeadSubmission(request, env) {
  try {
    const data = await request.json();

    const { account_type, name, email, phone, city, company_name, industry, message } = data;

    if (!name || !account_type || (!email && !phone)) {
      return jsonResponse({ error: 'name, account_type, and email or phone are required' }, 400);
    }

    const result = await env.DB.prepare(
      `INSERT INTO leads (account_type, name, email, phone, city, company_name, industry, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(account_type, name, email || '', phone || null, city || null, company_name || null, industry || null, message || null)
      .run();

    // Send email notification
    await sendNotificationEmail(env, { account_type, name, email, phone, city, company_name, industry, message });

    return jsonResponse({ success: true, id: result.meta.last_row_id });
  } catch (err) {
    console.error('Lead submission error:', err);
    return jsonResponse({ error: 'Failed to save lead' }, 500);
  }
}

async function sendNotificationEmail(env, lead) {
  try {
    const msg = createMimeMessage();
    msg.setSender({ name: 'YoTeTraigo', addr: 'no-reply@yotetraigo.com' });
    msg.setRecipient('matt@word.me');
    msg.setSubject(`New ${lead.account_type === 'business' ? 'Business' : 'Individual'} Lead: ${lead.name}`);

    const lines = [
      `New lead submitted on YoTeTraigo.com`,
      ``,
      `Type: ${lead.account_type === 'business' ? 'Business / Commercial' : 'Individual'}`,
      `Name: ${lead.name}`,
      `WhatsApp: ${lead.phone || 'N/A'}`,
      `Email: ${lead.email || 'N/A'}`,
      `City: ${lead.city || 'N/A'}`,
    ];

    if (lead.account_type === 'business') {
      lines.push(`Company: ${lead.company_name || 'N/A'}`);
      lines.push(`Industry: ${lead.industry || 'N/A'}`);
      lines.push(`Message: ${lead.message || 'N/A'}`);
    }

    msg.addMessage({ contentType: 'text/plain', data: lines.join('\n') });

    const email = new EmailMessage('no-reply@yotetraigo.com', 'matt@word.me', msg.asRaw());
    await env.EMAIL.send(email);
  } catch (err) {
    console.error('Email send error:', err);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
