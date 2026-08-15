#!/usr/bin/env node
/**
 * Builds a mobile snapshot: everything the Android app would otherwise spend
 * thousands of HTTP requests collecting, packaged as one archive it can import
 * in a single step.
 *
 * Reads through the API (no direct database access needed) and writes:
 *
 *   snapshot/
 *     data.json                  rows in the mobile app's shape
 *     c__<visitId>__<key>.png    drawings
 *     f__<id>.<ext>              attachments, records, investigations
 *
 * The folder is flat on purpose: the phone imports it through Android's
 * Storage Access Framework, which lists one directory at a time — a nested
 * tree would mean walking subfolder URIs by hand.
 *
 * Usage:
 *   node tools/build-mobile-snapshot.js \
 *     --server http://192.168.8.50:3000 \
 *     --email doctor@example.com --password secret \
 *     --out /path/to/snapshot
 *
 * The output directory contains patient medical records. Treat it accordingly:
 * put it on the phone, then delete it.
 */

const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, all) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), all[i + 1]]);
    return acc;
  }, [])
);

const SERVER = (args.server || 'http://localhost:3000').replace(/\/$/, '');
const API = `${SERVER}/api`;
const OUT = args.out || path.join(process.cwd(), 'snapshot');
const CONCURRENCY = Number(args.concurrency || 8);

const CANVAS_FIELDS = [
  'chiefComplaintDrawing', 'diagnosisDrawing',
  'notesDrawing', 'notesDrawing2', 'notesDrawing3',
  'pastMedicalHistoryDrawing', 'hpiDrawing', 'drugHistoryDrawing',
  'familyHistoryDrawing', 'currentMedicationDrawing',
  'radiologyDrawing', 'radiologyDrawing2', 'radiologyDrawing3',
];

const TEXT_MODE_PREFIX = 'TEXT_MODE:';

/** Strips the web app's display prefix so paths resolve against /files. */
const storagePath = (value) => String(value || '').replace(/^\/?files\//, '');

async function pool(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...await Promise.all(items.slice(i, i + size).map(fn)));
  }
  return out;
}

async function main() {
  if (!args.email || !args.password) {
    console.error('Missing --email / --password');
    process.exit(1);
  }

  const auth = await (await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: args.email, password: args.password }),
  })).json();
  if (!auth.token) {
    console.error('Login failed');
    process.exit(1);
  }
  const H = { Authorization: `Bearer ${auth.token}` };
  const get = async (p) => (await fetch(`${API}${p}`, { headers: H })).json();

  fs.mkdirSync(OUT, { recursive: true });

  const started = Date.now();
  const patientsRaw = await get('/patients');
  const patients = Array.isArray(patientsRaw) ? patientsRaw : (patientsRaw.patients || []);
  console.log(`patients: ${patients.length}`);

  const data = {
    version: 1,
    createdAt: new Date().toISOString(),
    server: SERVER,
    patients: [],
    visits: [],
    labResults: [],
    investigations: [],
    records: [],
    attachments: [],
  };

  let files = 0;
  let bytes = 0;

  async function download(remoteUrl, destAbs) {
    const rel = storagePath(remoteUrl);
    if (!rel) return null;
    if (fs.existsSync(destAbs)) return destAbs;
    const res = await fetch(`${SERVER}/files/${rel}`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    fs.writeFileSync(destAbs, buf);
    files++;
    bytes += buf.length;
    return destAbs;
  }

  // ── patients, visits, canvases, attachments ──────────────────────────────
  let done = 0;
  await pool(patients, CONCURRENCY, async (p) => {
    data.patients.push({
      id: p.id, fileNumber: p.fileNumber || '', name: p.name, phone: p.phone || '',
      age: p.age || 0, gender: p.gender || 'male', medicalHistory: p.medicalHistory || '',
      allergies: JSON.stringify(p.allergies || []), createdAt: p.createdAt || '',
    });

    const visits = await get(`/visits/patient/${p.id}`).catch(() => []);
    for (const meta of (Array.isArray(visits) ? visits : [])) {
      const full = await get(`/visits/${meta.id}`).catch(() => null);
      if (!full) continue;

      const canvasText = {};
      for (const key of CANVAS_FIELDS) {
        let value = full[key];
        if (!value || typeof value !== 'string' || value.length < 5) continue;
        if (value.startsWith(TEXT_MODE_PREFIX)) {
          try {
            const parsed = JSON.parse(value.slice(TEXT_MODE_PREFIX.length));
            canvasText[key] = parsed.text || '';
            value = parsed.dataUrl;
          } catch { continue; }
        }
        if (!value || value.startsWith('data:')) continue;
        await download(value, path.join(OUT, `c__${full.id}__${key}.png`));
      }

      data.visits.push({
        id: full.id, patientId: full.patientId,
        visitDate: full.visitDate || '', visitType: full.visitType || 'new',
        price: full.price || 0,
        chiefComplaint: full.chiefComplaint || '', diagnosis: full.diagnosis || '',
        notes: full.notes || '',
        vitals: typeof full.vitals === 'object' ? JSON.stringify(full.vitals) : (full.vitals || null),
        labTestRequest: full.labTestRequest || null,
        radiologyRequest: full.radiologyRequest || null,
        prescriptionMedicines: full.prescriptionMedicines || null,
        medicalChecklists: full.medicalChecklists || null,
        updatedAt: full.updatedAt || '',
        canvasText,
      });

      const atts = await get(`/visits/${full.id}/attachments`).catch(() => []);
      for (const a of (Array.isArray(atts) ? atts : [])) {
        const ext = storagePath(a.dataUrl).split('.').pop() || 'bin';
        const dest = path.join(OUT, `f__${a.id}.${ext}`);
        const saved = a.dataUrl && !a.dataUrl.startsWith('data:') ? await download(a.dataUrl, dest) : null;
        data.attachments.push({
          id: a.id, visitId: full.id, name: a.name || '', fileType: a.type || '',
          remoteUrl: storagePath(a.dataUrl), uploadedAt: a.createdAt || '',
          cachedAs: saved ? path.basename(saved) : '',
        });
      }
    }

    // ── labs, investigations, records ─────────────────────────────────────
    const [labs, invs, recs] = await Promise.all([
      get(`/lab-results/patient/${p.id}`).catch(() => []),
      get(`/previous-investigations/patient/${p.id}`).catch(() => []),
      get(`/patient-records/patient/${p.id}`).catch(() => []),
    ]);

    for (const l of (Array.isArray(labs) ? labs : [])) {
      data.labResults.push({
        id: l.id, patientId: p.id, category: l.category || '', testName: l.testName || '',
        resultValue: l.resultValue || '', unit: l.unit || null,
        referenceRange: l.referenceRange || null, isAbnormal: l.isAbnormal ? 1 : 0,
        testDate: l.testDate || '', notes: l.notes || null,
      });
    }

    for (const [rows, bucket] of [[invs, 'investigations'], [recs, 'records']]) {
      for (const r of (Array.isArray(rows) ? rows : [])) {
        const ext = storagePath(r.fileUrl).split('.').pop() || 'bin';
        const dest = path.join(OUT, `f__${r.id}.${ext}`);
        const saved = r.fileUrl ? await download(r.fileUrl, dest) : null;
        data[bucket].push({
          id: r.id, patientId: p.id, name: r.name || '', fileType: r.fileType || '',
          remoteUrl: storagePath(r.fileUrl), uploadedAt: r.uploadedAt || '',
          cachedAs: saved ? path.basename(saved) : '',
        });
      }
    }

    done++;
    if (done % 25 === 0 || done === patients.length) {
      const mb = (bytes / 1048576).toFixed(0);
      process.stdout.write(`\r${done}/${patients.length} patients · ${files} files · ${mb} MB`);
    }
  });

  fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify(data));

  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`\n\nsnapshot written to ${OUT}`);
  console.log(`  patients      ${data.patients.length}`);
  console.log(`  visits        ${data.visits.length}`);
  console.log(`  lab results   ${data.labResults.length}`);
  console.log(`  records+inv   ${data.records.length + data.investigations.length}`);
  console.log(`  attachments   ${data.attachments.length}`);
  console.log(`  files on disk ${files} (${(bytes / 1048576).toFixed(0)} MB)`);
  console.log(`  took          ${seconds}s`);
  console.log(`\nNext: copy this folder to the phone (USB is fastest), then in the`);
  console.log(`app: Settings → Import snapshot → pick the folder.`);
}

main().catch((err) => {
  console.error('snapshot failed:', err.message);
  process.exit(1);
});
