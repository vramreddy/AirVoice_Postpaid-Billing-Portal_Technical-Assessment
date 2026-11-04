const net = require('net');
const http = require('http');

let emails = [];

function startMailFallback(smtpPort = 1025, webPort = 8025) {
  // Test if SMTP port is already in use
  const smtpServer = net.createServer(socket => {
    socket.setEncoding('utf8');
    socket.write('220 mailpit-mock ESMTP\r\n');
    let buffer = '';
    let inData = false;
    let dataBuffer = '';

    socket.on('data', chunk => {
      buffer += chunk;
      let lines = buffer.split('\r\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (inData) {
          if (line === '.') {
            inData = false;
            // Parse email
            const textMatch = dataBuffer.match(/(?:Your AirVoice verification code is|code is)\s+(\d{6})/i);
            const toMatch = dataBuffer.match(/To:\s*([^\r\n]+)/i);
            const subjectMatch = dataBuffer.match(/Subject:\s*([^\r\n]+)/i);
            const otp = textMatch ? textMatch[1] : '';
            const emailRecord = {
              id: Date.now().toString(),
              to: toMatch ? toMatch[1].trim() : 'demo@example.test',
              subject: subjectMatch ? subjectMatch[1].trim() : 'Your AirVoice sign-in code',
              body: dataBuffer,
              otp,
              date: new Date().toISOString()
            };
            emails.unshift(emailRecord);
            console.log(`\n======================================================`);
            console.log(`[Mailpit Mock] 📧 Received email for ${emailRecord.to}`);
            console.log(`[Mailpit Mock] Subject: ${emailRecord.subject}`);
            if (otp) {
              console.log(`[Mailpit Mock] 🔑 Verification Code (OTP): >>> ${otp} <<<`);
            }
            console.log(`======================================================\n`);
            socket.write('250 2.0.0 Ok: queued\r\n');
            dataBuffer = '';
          } else {
            dataBuffer += line + '\n';
          }
        } else {
          const upper = line.toUpperCase();
          if (upper.startsWith('HELO') || upper.startsWith('EHLO')) {
            socket.write('250-localhost\r\n250 8BITMIME\r\n');
          } else if (upper.startsWith('MAIL FROM:')) {
            socket.write('250 2.1.0 Ok\r\n');
          } else if (upper.startsWith('RCPT TO:')) {
            socket.write('250 2.1.5 Ok\r\n');
          } else if (upper.startsWith('DATA')) {
            inData = true;
            dataBuffer = '';
            socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
          } else if (upper.startsWith('QUIT')) {
            socket.write('221 2.0.0 Bye\r\n');
            socket.end();
          } else if (upper.startsWith('RSET')) {
            socket.write('250 2.0.0 Ok\r\n');
          } else if (upper.startsWith('NOOP')) {
            socket.write('250 2.0.0 Ok\r\n');
          } else {
            socket.write('250 2.0.0 Ok\r\n');
          }
        }
      }
    });
  });

  smtpServer.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Mail] Port ${smtpPort} is already in use (real Mailpit is likely running).`);
    } else {
      console.error('[Mail Mock Error]', err);
    }
  });

  smtpServer.listen(smtpPort, () => {
    console.log(`[Mail Mock] SMTP mock server listening on port ${smtpPort}`);
  });

  // Web inbox on port 8025
  const webServer = http.createServer((req, res) => {
    if (req.url === '/api/v1/messages') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ total: emails.length, messages: emails }));
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const rows = emails.map(m => `
      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <strong style="color:#1e293b; font-size:16px;">${m.subject}</strong>
          <span style="color:#64748b; font-size:12px;">${new Date(m.date).toLocaleTimeString()}</span>
        </div>
        <div style="color:#475569; font-size:14px; margin-bottom:12px;">To: <b>${m.to}</b></div>
        ${m.otp ? `
          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:12px 16px; margin-bottom:12px; display:inline-block;">
            <div style="font-size:12px; color:#1e40af; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Verification Code (OTP)</div>
            <div style="font-size:28px; font-weight:700; color:#1d4ed8; letter-spacing:4px; font-family:monospace; margin-top:4px;">${m.otp}</div>
          </div>
        ` : ''}
        <pre style="background:#f8fafc; border-radius:4px; padding:10px; font-size:13px; color:#334155; overflow-x:auto; white-space:pre-wrap;">${m.body.replace(/</g, '&lt;')}</pre>
      </div>
    `).join('');

    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AirVoice Local Mail Inbox</title>
  <meta http-equiv="refresh" content="5">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#f1f5f9; margin:0; padding:24px; color:#0f172a; }
    .container { max-width:800px; margin:0 auto; }
    .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .title { font-size:22px; font-weight:700; color:#0f172a; }
    .badge { background:#2563eb; color:#fff; font-size:12px; font-weight:600; padding:4px 10px; border-radius:999px; }
    .empty { background:#fff; border-radius:8px; padding:48px 24px; text-align:center; color:#64748b; border:1px dashed #cbd5e1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">📬 AirVoice Local Mail Inbox</div>
      <div class="badge">${emails.length} message${emails.length === 1 ? '' : 's'}</div>
    </div>
    ${emails.length > 0 ? rows : '<div class="empty"><h3>No messages received yet</h3><p>When you request an OTP from the sign-in page, it will appear here automatically.</p></div>'}
  </div>
</body>
</html>`);
  });

  webServer.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Mail] Port ${webPort} is already in use.`);
    } else {
      console.error('[Mail Web Error]', err);
    }
  });

  webServer.listen(webPort, () => {
    console.log(`[Mail Mock] Mailpit web inbox available at http://localhost:${webPort}`);
  });
}

module.exports = { startMailFallback, emails };

