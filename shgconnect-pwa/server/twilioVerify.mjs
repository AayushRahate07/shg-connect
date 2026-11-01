import https from 'node:https';
import querystring from 'node:querystring';

export function formatE164(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export function sendTwilioVerification(env, phone) {
  return new Promise((resolve) => {
    const accountSid = env.TWILIO_ACCOUNT_SID;
    const auth = env.TWILIO_AUTH_TOKEN;
    const serviceSid = env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !auth || !serviceSid) {
      console.warn('[Twilio Server] Missing credentials in environment');
      return resolve({ success: false, error: 'Twilio credentials not configured' });
    }

    const to = formatE164(phone);
    const postData = querystring.stringify({
      To: to,
      Channel: 'sms'
    });

    const authHeader = 'Basic ' + Buffer.from(accountSid + ':' + auth).toString('base64');
    const options = {
      hostname: 'verify.twilio.com',
      port: 443,
      path: `/v2/Services/${serviceSid}/Verifications`,
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Twilio Server] Verification dispatched to ${to} (SID: ${parsed.sid})`);
            resolve({ success: true, to, sid: parsed.sid, status: parsed.status });
          } else {
            console.error('[Twilio Server Error]', parsed.message || parsed);
            resolve({ success: false, error: parsed.message || 'Twilio dispatch failed', code: parsed.code });
          }
        } catch (e) {
          resolve({ success: false, error: 'Invalid response from Twilio' });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[Twilio Server Network Error]', e.message);
      resolve({ success: false, error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

export function checkTwilioVerification(env, phone, code) {
  return new Promise((resolve) => {
    const accountSid = env.TWILIO_ACCOUNT_SID;
    const auth = env.TWILIO_AUTH_TOKEN;
    const serviceSid = env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !auth || !serviceSid) {
      return resolve({ verified: false, error: 'Twilio credentials not configured' });
    }

    const to = formatE164(phone);
    const postData = querystring.stringify({
      To: to,
      Code: (code || '').trim()
    });

    const authHeader = 'Basic ' + Buffer.from(accountSid + ':' + auth).toString('base64');
    const options = {
      hostname: 'verify.twilio.com',
      port: 443,
      path: `/v2/Services/${serviceSid}/VerificationCheck`,
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.status === 'approved') {
            console.log(`[Twilio Server] Verification APPROVED for ${to}`);
            resolve({ verified: true, status: parsed.status });
          } else {
            console.log(`[Twilio Server] Verification NOT approved for ${to}: ${parsed.status}`);
            resolve({ verified: false, error: parsed.message || 'Verification failed', status: parsed.status });
          }
        } catch (e) {
          resolve({ verified: false, error: 'Invalid response from Twilio' });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ verified: false, error: e.message });
    });

    req.write(postData);
    req.end();
  });
}
