import crypto from 'crypto';

// Secret key for license generation (KEEP THIS SECRET - don't share with customers)
const LICENSE_SECRET = 'Roashetta-2024-SecretKey-ChangeThis';

interface LicenseData {
  clinicName: string;
  expiryDate: string; // YYYY-MM-DD or 'lifetime'
  maxDoctors: number;
}

/**
 * Generates a license key for a clinic
 * Format: BASE64(clinicName|expiryDate|maxDoctors|signature)
 */
export function generateLicenseKey(data: LicenseData): string {
  const payload = `${data.clinicName}|${data.expiryDate}|${data.maxDoctors}`;
  const signature = crypto
    .createHmac('sha256', LICENSE_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16); // Take first 16 chars for shorter key

  const fullPayload = `${payload}|${signature}`;
  const encoded = Buffer.from(fullPayload).toString('base64');

  // Format as readable chunks: XXXX-XXXX-XXXX-XXXX
  const chunks = encoded.match(/.{1,4}/g) || [];
  return chunks.join('-');
}

/**
 * Validates a license key and returns the license data if valid
 */
export function validateLicenseKey(licenseKey: string): { valid: boolean; data?: LicenseData; error?: string } {
  try {
    // Remove dashes and decode
    const encoded = licenseKey.replace(/-/g, '');
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');

    const parts = decoded.split('|');
    if (parts.length !== 4) {
      return { valid: false, error: 'Invalid license format' };
    }

    const [clinicName, expiryDate, maxDoctorsStr, signature] = parts;
    const maxDoctors = parseInt(maxDoctorsStr, 10);

    // Verify signature
    const payload = `${clinicName}|${expiryDate}|${maxDoctors}`;
    const expectedSignature = crypto
      .createHmac('sha256', LICENSE_SECRET)
      .update(payload)
      .digest('hex')
      .substring(0, 16);

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid license key' };
    }

    // Check expiry
    if (expiryDate !== 'lifetime') {
      const expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) {
        return { valid: false, error: 'Invalid expiry date in license' };
      }
      if (expiry < new Date()) {
        return { valid: false, error: `License expired on ${expiryDate}` };
      }
    }

    return {
      valid: true,
      data: {
        clinicName,
        expiryDate,
        maxDoctors,
      },
    };
  } catch (error) {
    return { valid: false, error: 'Failed to parse license key' };
  }
}

/**
 * Check if license allows more doctors to be created
 */
export function canCreateDoctor(licenseKey: string, currentDoctorCount: number): boolean {
  const result = validateLicenseKey(licenseKey);
  if (!result.valid || !result.data) return false;

  // -1 means unlimited
  if (result.data.maxDoctors === -1) return true;

  return currentDoctorCount < result.data.maxDoctors;
}
