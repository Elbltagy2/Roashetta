/**
 * License Key Generator for Roashetta
 *
 * Usage:
 *   npx ts-node tools/generate-license.ts "Clinic Name" "2025-12-31" 3
 *   npx ts-node tools/generate-license.ts "Clinic Name" "lifetime" -1
 *
 * Arguments:
 *   1. Clinic Name (string)
 *   2. Expiry Date (YYYY-MM-DD or "lifetime")
 *   3. Max Doctors (number, -1 for unlimited)
 *
 * KEEP THIS TOOL SECRET - Don't include in customer deliverables!
 */

import { generateLicenseKey, validateLicenseKey } from '../src/utils/license';

const args = process.argv.slice(2);

if (args.length < 3) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          Roashetta License Key Generator                     ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  npx ts-node tools/generate-license.ts <clinic_name> <expiry_date> <max_doctors>

Arguments:
  clinic_name  - Name of the clinic (use quotes for spaces)
  expiry_date  - Expiry date (YYYY-MM-DD) or "lifetime"
  max_doctors  - Maximum number of doctors (-1 for unlimited)

Examples:
  # Lifetime license for 3 doctors:
  npx ts-node tools/generate-license.ts "Cairo Medical Center" lifetime 3

  # 1-year license for unlimited doctors:
  npx ts-node tools/generate-license.ts "Dr. Ahmed Clinic" "2025-12-31" -1

  # Trial license (30 days, 1 doctor):
  npx ts-node tools/generate-license.ts "Test Clinic" "2024-03-01" 1
`);
  process.exit(1);
}

const [clinicName, expiryDate, maxDoctorsStr] = args;
const maxDoctors = parseInt(maxDoctorsStr, 10);

if (isNaN(maxDoctors)) {
  console.error('Error: max_doctors must be a number');
  process.exit(1);
}

if (expiryDate !== 'lifetime' && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
  console.error('Error: expiry_date must be in YYYY-MM-DD format or "lifetime"');
  process.exit(1);
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║          Roashetta License Key Generator                     ║
╚══════════════════════════════════════════════════════════════╝
`);

console.log('Generating license for:');
console.log(`  Clinic Name: ${clinicName}`);
console.log(`  Expiry Date: ${expiryDate}`);
console.log(`  Max Doctors: ${maxDoctors === -1 ? 'Unlimited' : maxDoctors}`);
console.log('');

const licenseKey = generateLicenseKey({
  clinicName,
  expiryDate,
  maxDoctors,
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('LICENSE KEY:');
console.log('');
console.log(`  ${licenseKey}`);
console.log('');
console.log('═══════════════════════════════════════════════════════════════');

// Verify the generated key
const verification = validateLicenseKey(licenseKey);
console.log('');
console.log('Verification:', verification.valid ? '✓ Valid' : `✗ Invalid: ${verification.error}`);
if (verification.data) {
  console.log('Decoded Data:', verification.data);
}
