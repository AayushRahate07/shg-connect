import { describe, it, expect } from 'vitest';
import { app } from '../app';

// Helper to simulate request via express app without external agent
const makeRequest = async (path: string, body: any) => {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const req: any = {
      method: 'POST',
      url: path,
      headers: { 'content-type': 'application/json' },
      body
    };

    let statusCode = 200;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        resolve({ status: statusCode, body: data });
      },
      setHeader: () => res,
      end: () => resolve({ status: statusCode, body: {} })
    };

    (app as any).handle(req, res);
  });
};

describe('SHGConnect Hybrid OTP API Tests', () => {
  it('rejects invalid phone numbers', async () => {
    const res = await makeRequest('/api/v1/otp/send', { phone: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid 10-digit');
  });

  it('generates and dispatches OTP for valid 10-digit number', async () => {
    const res = await makeRequest('/api/v1/otp/send', {
      phone: '9823011223',
      memberId: 'mem-1',
      shgName: 'Savitri SHG'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.phoneMasked).toBeDefined();
    expect(res.body.devOtp).toBeDefined(); // Returned in dev simulator mode
    expect(res.body.devOtp.length).toBe(6);

    const generatedOtp = res.body.devOtp;

    // Verify with incorrect OTP
    const failRes = await makeRequest('/api/v1/otp/verify', {
      phone: '9823011223',
      otp: '000000'
    });
    expect(failRes.status).toBe(400);
    expect(failRes.body.verified).toBe(false);

    // Verify with correct OTP
    const successRes = await makeRequest('/api/v1/otp/verify', {
      phone: '9823011223',
      otp: generatedOtp
    });
    expect(successRes.status).toBe(200);
    expect(successRes.body.verified).toBe(true);
  });
});
