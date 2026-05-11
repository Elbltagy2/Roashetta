export interface RadiologyTest {
  id: string;
  name: string;
}

export interface RadiologyTestCategory {
  id: string;
  name: string;
  nameAr: string;
  tests: RadiologyTest[];
}

export const RADIOLOGY_TEST_CATEGORIES: RadiologyTestCategory[] = [
  // ===================== PLAIN RADIOGRAPHY (X-RAY) =====================
  {
    id: 'xray-chest',
    name: 'X-Ray: Chest',
    nameAr: 'أشعة سينية: الصدر',
    tests: [
      { id: 'xray-chest-pa-lateral', name: 'Chest X-ray (PA & Lateral)' },
      { id: 'xray-chest-ap-portable', name: 'Chest X-ray (AP / Portable)' },
      { id: 'xray-chest-lateral-decubitus', name: 'Chest X-ray (Lateral Decubitus)' },
      { id: 'xray-chest-lordotic', name: 'Chest X-ray (Lordotic View)' },
      { id: 'xray-rib-series', name: 'Rib Series' },
    ]
  },
  {
    id: 'xray-abdomen',
    name: 'X-Ray: Abdomen',
    nameAr: 'أشعة سينية: البطن',
    tests: [
      { id: 'xray-kub', name: 'Abdominal X-ray (KUB)' },
      { id: 'xray-acute-abdominal-series', name: 'Acute Abdominal Series (Upright, Supine, Decubitus)' },
    ]
  },
  {
    id: 'xray-spine',
    name: 'X-Ray: Spine',
    nameAr: 'أشعة سينية: العمود الفقري',
    tests: [
      { id: 'xray-cervical-spine', name: 'Cervical Spine X-ray (AP, Lateral, Oblique, Odontoid)' },
      { id: 'xray-thoracic-spine', name: 'Thoracic Spine X-ray (AP & Lateral)' },
      { id: 'xray-lumbar-spine', name: 'Lumbar Spine X-ray (AP, Lateral, Oblique)' },
      { id: 'xray-lumbosacral', name: 'Lumbosacral Spine X-ray' },
      { id: 'xray-sacrum-coccyx', name: 'Sacrum / Coccyx X-ray' },
      { id: 'xray-scoliosis-series', name: 'Scoliosis Series (Full Spine)' },
      { id: 'xray-flexion-extension', name: 'Flexion-Extension Views (Cervical / Lumbar)' },
    ]
  },
  {
    id: 'xray-upper-extremity',
    name: 'X-Ray: Upper Extremity',
    nameAr: 'أشعة سينية: الطرف العلوي',
    tests: [
      { id: 'xray-shoulder', name: 'Shoulder X-ray (AP, Axillary, Y-view)' },
      { id: 'xray-clavicle', name: 'Clavicle X-ray' },
      { id: 'xray-ac-joint', name: 'Acromioclavicular (AC) Joint X-ray' },
      { id: 'xray-humerus', name: 'Humerus X-ray' },
      { id: 'xray-elbow', name: 'Elbow X-ray (AP & Lateral)' },
      { id: 'xray-forearm', name: 'Forearm X-ray' },
      { id: 'xray-wrist', name: 'Wrist X-ray (PA, Lateral, Oblique, Scaphoid)' },
      { id: 'xray-hand', name: 'Hand X-ray (PA, Lateral, Oblique)' },
      { id: 'xray-finger', name: 'Finger X-ray' },
    ]
  },
  {
    id: 'xray-lower-extremity',
    name: 'X-Ray: Lower Extremity',
    nameAr: 'أشعة سينية: الطرف السفلي',
    tests: [
      { id: 'xray-pelvis', name: 'Pelvis X-ray (AP)' },
      { id: 'xray-hip', name: 'Hip X-ray (AP & Lateral / Frog-Leg)' },
      { id: 'xray-femur', name: 'Femur X-ray' },
      { id: 'xray-knee', name: 'Knee X-ray (AP, Lateral, Sunrise, Tunnel)' },
      { id: 'xray-tibia-fibula', name: 'Tibia/Fibula X-ray' },
      { id: 'xray-ankle', name: 'Ankle X-ray (AP, Lateral, Mortise)' },
      { id: 'xray-foot', name: 'Foot X-ray (AP, Lateral, Oblique)' },
      { id: 'xray-toe', name: 'Toe X-ray' },
      { id: 'xray-calcaneus', name: 'Calcaneus (Heel) X-ray' },
      { id: 'xray-weight-bearing', name: 'Weight-Bearing Views (Knee, Ankle, Foot)' },
    ]
  },
  {
    id: 'xray-head-facial',
    name: 'X-Ray: Head & Facial',
    nameAr: 'أشعة سينية: الرأس والوجه',
    tests: [
      { id: 'xray-skull', name: 'Skull X-ray (AP & Lateral)' },
      { id: 'xray-facial-bones', name: 'Facial Bones X-ray (Waters, Caldwell)' },
      { id: 'xray-nasal-bones', name: 'Nasal Bones X-ray' },
      { id: 'xray-mandible', name: 'Mandible X-ray' },
      { id: 'xray-orbits', name: 'Orbits X-ray' },
      { id: 'xray-tmj', name: 'TMJ X-ray' },
      { id: 'xray-sinuses', name: 'Sinuses X-ray (Waters, Caldwell, Lateral)' },
    ]
  },
  {
    id: 'xray-other',
    name: 'X-Ray: Other',
    nameAr: 'أشعة سينية: أخرى',
    tests: [
      { id: 'xray-soft-tissue-neck', name: 'Soft Tissue Neck X-ray' },
      { id: 'xray-sternum', name: 'Sternum X-ray' },
      { id: 'xray-bone-survey', name: 'Bone Survey (Myeloma / Metastatic)' },
      { id: 'xray-bone-age', name: 'Bone Age Study (Left Hand/Wrist)' },
      { id: 'xray-skeletal-survey', name: 'Pediatric Skeletal Survey' },
      { id: 'xray-babygram', name: 'Babygram (Whole Body Neonatal)' },
    ]
  },

  // ===================== CT SCAN =====================
  {
    id: 'ct-head-neck',
    name: 'CT: Head & Neck',
    nameAr: 'أشعة مقطعية: الرأس والرقبة',
    tests: [
      { id: 'ct-head-non-contrast', name: 'CT Head / Brain (Non-Contrast)' },
      { id: 'ct-head-contrast', name: 'CT Head (With Contrast)' },
      { id: 'ct-head-with-without', name: 'CT Head (With & Without Contrast)' },
      { id: 'ct-orbits', name: 'CT Orbits' },
      { id: 'ct-sinuses', name: 'CT Sinuses / Paranasal Sinuses' },
      { id: 'ct-temporal-bones', name: 'CT Temporal Bones' },
      { id: 'ct-neck-soft-tissue', name: 'CT Neck (Soft Tissue)' },
      { id: 'ct-face', name: 'CT Face / Facial Bones' },
      { id: 'ct-mandible', name: 'CT Mandible' },
      { id: 'cta-head', name: 'CTA Head (Circle of Willis)' },
      { id: 'cta-neck', name: 'CTA Neck (Carotid/Vertebral)' },
      { id: 'ct-perfusion-brain', name: 'CT Perfusion Brain (Stroke Protocol)' },
    ]
  },
  {
    id: 'ct-chest',
    name: 'CT: Chest',
    nameAr: 'أشعة مقطعية: الصدر',
    tests: [
      { id: 'ct-chest-non-contrast', name: 'CT Chest (Non-Contrast)' },
      { id: 'ct-chest-contrast', name: 'CT Chest (With Contrast)' },
      { id: 'ct-chest-with-without', name: 'CT Chest (With & Without Contrast)' },
      { id: 'ctpa', name: 'CT Pulmonary Angiography (CTPA) – PE Protocol' },
      { id: 'ct-hrct', name: 'HRCT – Interstitial Lung Disease' },
      { id: 'ct-chest-low-dose', name: 'CT Chest Low-Dose (Lung Screening)' },
      { id: 'cta-thoracic-aorta', name: 'CTA Thoracic Aorta' },
      { id: 'ct-calcium-score', name: 'CT Cardiac / Coronary Calcium Score' },
      { id: 'ccta', name: 'CT Coronary Angiography (CCTA)' },
    ]
  },
  {
    id: 'ct-abdomen-pelvis',
    name: 'CT: Abdomen & Pelvis',
    nameAr: 'أشعة مقطعية: البطن والحوض',
    tests: [
      { id: 'ct-abdomen-non-contrast', name: 'CT Abdomen (Non-Contrast)' },
      { id: 'ct-abdomen-contrast', name: 'CT Abdomen (With Contrast)' },
      { id: 'ct-abdomen-pelvis-contrast', name: 'CT Abdomen & Pelvis (With Contrast)' },
      { id: 'ct-abdomen-pelvis-with-without', name: 'CT Abdomen & Pelvis (With & Without Contrast)' },
      { id: 'ct-renal-stone', name: 'CT Abdomen & Pelvis (Non-Contrast) – Renal Stone' },
      { id: 'cta-abdominal-aorta', name: 'CTA Abdominal Aorta' },
      { id: 'cta-renal-arteries', name: 'CTA Renal Arteries' },
      { id: 'cta-mesenteric', name: 'CTA Mesenteric Vessels' },
      { id: 'ct-enterography', name: 'CT Enterography (Small Bowel)' },
      { id: 'ct-colonography', name: 'CT Colonography (Virtual Colonoscopy)' },
      { id: 'ct-liver-multiphase', name: 'CT Liver (Multiphase)' },
      { id: 'ct-pancreas-multiphase', name: 'CT Pancreas (Multiphase)' },
      { id: 'ct-adrenal', name: 'CT Adrenal Protocol' },
      { id: 'ct-kidney-multiphase', name: 'CT Kidney (Multiphase / Renal Mass)' },
      { id: 'ct-pelvis', name: 'CT Pelvis (With Contrast)' },
      { id: 'ct-cystography', name: 'CT Cystography' },
    ]
  },
  {
    id: 'ct-spine-msk',
    name: 'CT: Spine & MSK',
    nameAr: 'أشعة مقطعية: العمود الفقري والعظام',
    tests: [
      { id: 'ct-cervical-spine', name: 'CT Cervical Spine' },
      { id: 'ct-thoracic-spine', name: 'CT Thoracic Spine' },
      { id: 'ct-lumbar-spine', name: 'CT Lumbar Spine' },
      { id: 'ct-sacrum-coccyx', name: 'CT Sacrum / Coccyx' },
      { id: 'ct-myelography', name: 'CT Myelography (Post-Myelogram)' },
      { id: 'ct-shoulder', name: 'CT Shoulder' },
      { id: 'ct-elbow', name: 'CT Elbow' },
      { id: 'ct-wrist-hand', name: 'CT Wrist / Hand' },
      { id: 'ct-hip', name: 'CT Hip' },
      { id: 'ct-knee', name: 'CT Knee' },
      { id: 'ct-ankle-foot', name: 'CT Ankle / Foot' },
      { id: 'ct-arthrography', name: 'CT Arthrography (Post Contrast Injection)' },
    ]
  },
  {
    id: 'ct-vascular-other',
    name: 'CT: Vascular & Other',
    nameAr: 'أشعة مقطعية: الأوعية وأخرى',
    tests: [
      { id: 'cta-aorta-full', name: 'CTA Aorta (Thoracic / Abdominal)' },
      { id: 'cta-lower-extremity', name: 'CTA Lower Extremity Runoff' },
      { id: 'cta-upper-extremity', name: 'CTA Upper Extremity' },
      { id: 'cta-pulmonary-veins', name: 'CTA Pulmonary Veins (Pre-Ablation)' },
      { id: 'ct-whole-body-trauma', name: 'CT Whole Body (Trauma / Polytrauma)' },
      { id: 'ct-guided-biopsy', name: 'CT-Guided Biopsy' },
      { id: 'ct-guided-drainage', name: 'CT-Guided Drainage' },
      { id: 'ct-guided-ablation', name: 'CT-Guided Ablation' },
    ]
  },

  // ===================== MRI =====================
  {
    id: 'mri-brain',
    name: 'MRI: Brain',
    nameAr: 'رنين مغناطيسي: المخ',
    tests: [
      { id: 'mri-brain-non-contrast', name: 'MRI Brain (Without Contrast)' },
      { id: 'mri-brain-with-without', name: 'MRI Brain (With & Without Contrast)' },
      { id: 'mri-brain-dwi', name: 'MRI Brain with DWI' },
      { id: 'mri-brain-epilepsy', name: 'MRI Brain – Epilepsy Protocol' },
      { id: 'mri-pituitary', name: 'MRI Brain – Pituitary Protocol' },
      { id: 'mri-iac', name: 'MRI Brain – Internal Auditory Canals' },
      { id: 'mri-brain-ms', name: 'MRI Brain – MS Protocol' },
      { id: 'mri-brain-tumor', name: 'MRI Brain – Tumor Protocol (With Perfusion)' },
      { id: 'mri-spectroscopy', name: 'MRI Spectroscopy (MRS)' },
      { id: 'fmri', name: 'Functional MRI (fMRI)' },
    ]
  },
  {
    id: 'mri-head-neck',
    name: 'MRI: Head & Neck',
    nameAr: 'رنين مغناطيسي: الرأس والرقبة',
    tests: [
      { id: 'mri-orbits', name: 'MRI Orbits' },
      { id: 'mri-temporal-bones', name: 'MRI Temporal Bones' },
      { id: 'mri-neck', name: 'MRI Neck (Soft Tissue)' },
      { id: 'mri-tmj', name: 'MRI TMJ' },
      { id: 'mri-sinuses', name: 'MRI Sinuses' },
      { id: 'mri-nasopharynx', name: 'MRI Nasopharynx / Oropharynx' },
      { id: 'mri-salivary-glands', name: 'MRI Salivary Glands' },
      { id: 'mri-brachial-plexus', name: 'MRI Brachial Plexus' },
    ]
  },
  {
    id: 'mri-spine',
    name: 'MRI: Spine',
    nameAr: 'رنين مغناطيسي: العمود الفقري',
    tests: [
      { id: 'mri-cervical-non-contrast', name: 'MRI Cervical Spine (Without Contrast)' },
      { id: 'mri-cervical-with-without', name: 'MRI Cervical Spine (With & Without Contrast)' },
      { id: 'mri-thoracic-non-contrast', name: 'MRI Thoracic Spine (Without Contrast)' },
      { id: 'mri-thoracic-with-without', name: 'MRI Thoracic Spine (With & Without Contrast)' },
      { id: 'mri-lumbar-non-contrast', name: 'MRI Lumbar Spine (Without Contrast)' },
      { id: 'mri-lumbar-with-without', name: 'MRI Lumbar Spine (With & Without Contrast)' },
      { id: 'mri-whole-spine', name: 'MRI Whole Spine (Screening)' },
      { id: 'mri-sacroiliac', name: 'MRI Sacroiliac Joints' },
    ]
  },
  {
    id: 'mri-msk',
    name: 'MRI: Musculoskeletal',
    nameAr: 'رنين مغناطيسي: العظام والمفاصل',
    tests: [
      { id: 'mri-shoulder', name: 'MRI Shoulder' },
      { id: 'mri-elbow', name: 'MRI Elbow' },
      { id: 'mri-wrist', name: 'MRI Wrist' },
      { id: 'mri-hand', name: 'MRI Hand / Fingers' },
      { id: 'mri-hip', name: 'MRI Hip' },
      { id: 'mri-knee', name: 'MRI Knee' },
      { id: 'mri-ankle', name: 'MRI Ankle' },
      { id: 'mri-foot', name: 'MRI Foot' },
      { id: 'mri-arthrography', name: 'MRI Arthrography (Post Gadolinium)' },
      { id: 'mri-whole-body', name: 'MRI Whole Body (Oncologic Screening)' },
    ]
  },
  {
    id: 'mri-chest-cardiac',
    name: 'MRI: Chest & Cardiac',
    nameAr: 'رنين مغناطيسي: الصدر والقلب',
    tests: [
      { id: 'mri-chest', name: 'MRI Chest / Thorax' },
      { id: 'cardiac-mri', name: 'Cardiac MRI (CMR)' },
      { id: 'cardiac-mri-stress', name: 'Cardiac MRI – Stress Perfusion' },
      { id: 'cardiac-mri-viability', name: 'Cardiac MRI – Viability Study' },
      { id: 'cardiac-mri-iron', name: 'Cardiac MRI – Iron Overload (T2*)' },
      { id: 'mri-breast', name: 'MRI Breast (Bilateral, With Contrast)' },
      { id: 'mri-breast-screening', name: 'MRI Breast – Screening (High-Risk)' },
    ]
  },
  {
    id: 'mri-abdomen-pelvis',
    name: 'MRI: Abdomen & Pelvis',
    nameAr: 'رنين مغناطيسي: البطن والحوض',
    tests: [
      { id: 'mri-abdomen-non-contrast', name: 'MRI Abdomen (Without Contrast)' },
      { id: 'mri-abdomen-with-without', name: 'MRI Abdomen (With & Without Contrast)' },
      { id: 'mri-liver-eovist', name: 'MRI Liver (Hepatocyte-Specific Contrast)' },
      { id: 'mri-liver-iron', name: 'MRI Liver – Iron Quantification' },
      { id: 'mri-liver-fat', name: 'MRI Liver – Fat Quantification (PDFF)' },
      { id: 'mri-liver-elastography', name: 'MRI Liver Elastography (MRE)' },
      { id: 'mrcp', name: 'MRCP (Cholangiopancreatography)' },
      { id: 'mri-pancreas', name: 'MRI Pancreas' },
      { id: 'mri-kidneys-adrenals', name: 'MRI Kidneys / Adrenals' },
      { id: 'mri-pelvis-non-contrast', name: 'MRI Pelvis (Without Contrast)' },
      { id: 'mri-pelvis-with-without', name: 'MRI Pelvis (With & Without Contrast)' },
      { id: 'mri-prostate', name: 'MRI Prostate (Multiparametric – mpMRI)' },
      { id: 'mri-rectum', name: 'MRI Rectum (Rectal Cancer Staging)' },
      { id: 'mri-female-pelvis', name: 'MRI Female Pelvis (Uterus / Ovaries)' },
      { id: 'mri-fetal', name: 'MRI Fetal' },
      { id: 'mri-enterography', name: 'MRI Enterography (Small Bowel)' },
    ]
  },
  {
    id: 'mri-vascular',
    name: 'MRI: Vascular (MRA)',
    nameAr: 'رنين مغناطيسي: الأوعية',
    tests: [
      { id: 'mra-brain', name: 'MRA Brain (Circle of Willis)' },
      { id: 'mra-neck', name: 'MRA Neck (Carotid / Vertebral)' },
      { id: 'mra-thoracic-aorta', name: 'MRA Thoracic Aorta' },
      { id: 'mra-abdominal-aorta', name: 'MRA Abdominal Aorta' },
      { id: 'mra-renal', name: 'MRA Renal Arteries' },
      { id: 'mra-lower-extremity', name: 'MRA Lower Extremity Runoff' },
      { id: 'mr-venography', name: 'MR Venography (Brain / Pelvis / Extremity)' },
    ]
  },

  // ===================== ULTRASOUND =====================
  {
    id: 'us-abdomen',
    name: 'Ultrasound: Abdomen',
    nameAr: 'موجات صوتية: البطن',
    tests: [
      { id: 'us-abdomen-complete', name: 'Abdominal US (Complete)' },
      { id: 'us-abdomen-limited', name: 'Abdominal US (Limited / Focused)' },
      { id: 'us-ruq', name: 'Right Upper Quadrant US (Gallbladder / Biliary)' },
      { id: 'us-renal', name: 'Renal US (Kidneys & Bladder)' },
      { id: 'us-liver-elastography', name: 'Liver US with Elastography' },
      { id: 'us-hepatic-doppler', name: 'Hepatic Doppler US' },
      { id: 'us-aortic', name: 'Aortic US (AAA Screening)' },
      { id: 'us-appendix', name: 'Appendix US' },
    ]
  },
  {
    id: 'us-pelvis',
    name: 'Ultrasound: Pelvis',
    nameAr: 'موجات صوتية: الحوض',
    tests: [
      { id: 'us-pelvic-transabdominal', name: 'Pelvic US (Transabdominal)' },
      { id: 'us-transvaginal', name: 'Transvaginal US' },
      { id: 'us-pelvic-combined', name: 'Pelvic US (Combined TA & TV)' },
      { id: 'us-scrotal', name: 'Scrotal US' },
      { id: 'us-penile-doppler', name: 'Penile Doppler US' },
    ]
  },
  {
    id: 'us-obstetric',
    name: 'Ultrasound: Obstetric',
    nameAr: 'موجات صوتية: الحمل',
    tests: [
      { id: 'us-first-trimester', name: 'First Trimester US / Viability Scan' },
      { id: 'us-nt-scan', name: 'Nuchal Translucency US (NT Scan)' },
      { id: 'us-anatomy-scan', name: 'Second Trimester Anatomy Scan (Level II)' },
      { id: 'us-growth', name: 'Third Trimester / Growth US' },
      { id: 'us-bpp', name: 'Biophysical Profile (BPP)' },
      { id: 'us-fetal-doppler', name: 'Fetal Doppler US (Umbilical, MCA)' },
      { id: 'us-cervical-length', name: 'Cervical Length Measurement' },
      { id: 'us-dating-scan', name: 'Obstetric Dating Scan' },
    ]
  },
  {
    id: 'us-thyroid-neck',
    name: 'Ultrasound: Thyroid & Neck',
    nameAr: 'موجات صوتية: الغدة الدرقية والرقبة',
    tests: [
      { id: 'us-thyroid', name: 'Thyroid US' },
      { id: 'us-neck-lymph', name: 'Neck / Lymph Node US' },
      { id: 'us-parathyroid', name: 'Parathyroid US' },
      { id: 'us-salivary-gland', name: 'Salivary Gland US' },
    ]
  },
  {
    id: 'us-breast',
    name: 'Ultrasound: Breast',
    nameAr: 'موجات صوتية: الثدي',
    tests: [
      { id: 'us-breast-bilateral', name: 'Breast US (Bilateral)' },
      { id: 'us-breast-targeted', name: 'Breast US (Targeted / Focused)' },
      { id: 'us-axillary', name: 'Axillary US' },
    ]
  },
  {
    id: 'us-vascular',
    name: 'Ultrasound: Vascular (Doppler)',
    nameAr: 'موجات صوتية: الأوعية (دوبلر)',
    tests: [
      { id: 'us-carotid-duplex', name: 'Carotid Duplex US' },
      { id: 'us-lower-venous-dvt', name: 'Lower Extremity Venous Duplex (DVT)' },
      { id: 'us-upper-venous', name: 'Upper Extremity Venous Duplex' },
      { id: 'us-lower-arterial', name: 'Lower Extremity Arterial Duplex' },
      { id: 'us-upper-arterial', name: 'Upper Extremity Arterial Duplex' },
      { id: 'us-renal-artery-doppler', name: 'Renal Artery Doppler' },
      { id: 'us-aorta-duplex', name: 'Abdominal Aorta Duplex' },
      { id: 'us-mesenteric-doppler', name: 'Mesenteric Doppler' },
      { id: 'us-av-fistula', name: 'AV Fistula / Graft Evaluation' },
      { id: 'us-tcd', name: 'Transcranial Doppler (TCD)' },
    ]
  },
  {
    id: 'us-msk',
    name: 'Ultrasound: Musculoskeletal',
    nameAr: 'موجات صوتية: العظام والمفاصل',
    tests: [
      { id: 'us-msk-shoulder', name: 'MSK US – Shoulder' },
      { id: 'us-msk-elbow', name: 'MSK US – Elbow' },
      { id: 'us-msk-wrist-hand', name: 'MSK US – Wrist / Hand' },
      { id: 'us-msk-hip', name: 'MSK US – Hip' },
      { id: 'us-msk-knee', name: 'MSK US – Knee' },
      { id: 'us-msk-ankle-foot', name: 'MSK US – Ankle / Foot' },
      { id: 'us-soft-tissue-mass', name: 'MSK US – Soft Tissue Mass / Lump' },
    ]
  },
  {
    id: 'us-other',
    name: 'Ultrasound: Other',
    nameAr: 'موجات صوتية: أخرى',
    tests: [
      { id: 'us-pleural', name: 'Chest / Pleural US (Effusion)' },
      { id: 'us-lung-poc', name: 'Lung US (Point-of-Care)' },
      { id: 'us-neonatal-head', name: 'Neonatal Head / Cranial US' },
      { id: 'us-pediatric-hip', name: 'Pediatric Hip US (DDH Screening)' },
      { id: 'us-guided-biopsy', name: 'US-Guided Biopsy' },
      { id: 'us-guided-aspiration', name: 'US-Guided Aspiration / Drainage' },
      { id: 'us-guided-joint-injection', name: 'US-Guided Joint Injection / Aspiration' },
      { id: 'us-guided-paracentesis', name: 'US-Guided Paracentesis' },
      { id: 'us-guided-thoracentesis', name: 'US-Guided Thoracentesis' },
    ]
  },

  // ===================== NUCLEAR MEDICINE & PET =====================
  {
    id: 'nuclear-bone',
    name: 'Nuclear Medicine: Bone',
    nameAr: 'طب نووي: العظام',
    tests: [
      { id: 'bone-scan', name: 'Bone Scan (Whole Body – Tc-99m MDP)' },
      { id: 'three-phase-bone-scan', name: 'Three-Phase Bone Scan' },
      { id: 'spect-bone', name: 'SPECT Bone Scan' },
      { id: 'bone-spect-ct', name: 'Bone SPECT/CT' },
    ]
  },
  {
    id: 'nuclear-cardiac',
    name: 'Nuclear Medicine: Cardiac',
    nameAr: 'طب نووي: القلب',
    tests: [
      { id: 'mpi-stress-rest', name: 'Myocardial Perfusion Imaging (MPI) – Stress/Rest' },
      { id: 'mpi-pharmacologic', name: 'Pharmacologic Stress MPI' },
      { id: 'muga-scan', name: 'MUGA Scan (Ejection Fraction)' },
      { id: 'cardiac-pet-perfusion', name: 'Cardiac PET Perfusion' },
      { id: 'cardiac-pet-viability', name: 'Cardiac PET Viability (FDG)' },
      { id: 'cardiac-amyloid', name: 'Cardiac Amyloid Scan' },
    ]
  },
  {
    id: 'nuclear-other',
    name: 'Nuclear Medicine: Other',
    nameAr: 'طب نووي: أخرى',
    tests: [
      { id: 'vq-scan', name: 'V/Q Scan (Ventilation-Perfusion)' },
      { id: 'thyroid-scan', name: 'Thyroid Scan (Tc-99m / I-123)' },
      { id: 'thyroid-uptake', name: 'Thyroid Uptake Study' },
      { id: 'renal-scan-mag3', name: 'Renal Scan (MAG3)' },
      { id: 'renal-scan-dtpa', name: 'Renal Scan (DTPA)' },
      { id: 'dmsa-scan', name: 'DMSA Renal Cortical Scan' },
      { id: 'hida-scan', name: 'HIDA Scan' },
      { id: 'gastric-emptying', name: 'Gastric Emptying Study' },
      { id: 'gi-bleeding-scan', name: 'GI Bleeding Scan (Tagged RBC)' },
      { id: 'dat-scan', name: 'DaT Scan (Parkinsonism)' },
      { id: 'sentinel-node', name: 'Sentinel Lymph Node Mapping' },
      { id: 'parathyroid-sestamibi', name: 'Parathyroid Sestamibi Scan' },
    ]
  },
  {
    id: 'pet-ct',
    name: 'PET/CT',
    nameAr: 'بت سكان',
    tests: [
      { id: 'fdg-pet-ct', name: 'FDG PET/CT (General Oncology)' },
      { id: 'psma-pet-ct', name: 'PSMA PET/CT (Prostate Cancer)' },
      { id: 'dotatate-pet-ct', name: 'Dotatate PET/CT (Neuroendocrine Tumors)' },
      { id: 'naf-pet-ct', name: 'NaF PET/CT (Bone Metastases)' },
      { id: 'fdg-pet-mri', name: 'FDG PET/MRI' },
    ]
  },

  // ===================== FLUOROSCOPY =====================
  {
    id: 'fluoroscopy',
    name: 'Fluoroscopy',
    nameAr: 'تنظير إشعاعي',
    tests: [
      { id: 'barium-swallow', name: 'Barium Swallow (Esophagram)' },
      { id: 'modified-barium-swallow', name: 'Modified Barium Swallow (Videofluoroscopic)' },
      { id: 'upper-gi-series', name: 'Upper GI Series' },
      { id: 'sbft', name: 'Small Bowel Follow-Through (SBFT)' },
      { id: 'barium-enema', name: 'Barium Enema' },
      { id: 'ivp', name: 'Intravenous Pyelogram (IVP)' },
      { id: 'vcug', name: 'Voiding Cystourethrogram (VCUG)' },
      { id: 'hsg', name: 'Hysterosalpingography (HSG)' },
      { id: 'myelography', name: 'Myelography' },
      { id: 'fistulogram', name: 'Fistulogram / Sinogram' },
      { id: 'fluoro-arthrography', name: 'Arthrography (Fluoroscopic Guided)' },
      { id: 't-tube-cholangiogram', name: 'T-Tube Cholangiogram' },
    ]
  },

  // ===================== MAMMOGRAPHY =====================
  {
    id: 'mammography',
    name: 'Mammography & Breast',
    nameAr: 'تصوير الثدي',
    tests: [
      { id: 'screening-mammo', name: 'Screening Mammography (2D)' },
      { id: 'diagnostic-mammo', name: 'Diagnostic Mammography' },
      { id: 'tomosynthesis-3d', name: 'Digital Breast Tomosynthesis (3D)' },
      { id: 'contrast-mammo', name: 'Contrast-Enhanced Mammography (CEM)' },
      { id: 'stereotactic-biopsy', name: 'Stereotactic Breast Biopsy' },
      { id: 'us-guided-breast-biopsy', name: 'US-Guided Breast Biopsy' },
      { id: 'mri-guided-breast-biopsy', name: 'MRI-Guided Breast Biopsy' },
      { id: 'wire-localization', name: 'Wire Localization (Pre-Operative)' },
    ]
  },

  // ===================== INTERVENTIONAL RADIOLOGY =====================
  {
    id: 'ir-vascular',
    name: 'IR: Vascular',
    nameAr: 'أشعة تداخلية: الأوعية',
    tests: [
      { id: 'diagnostic-angiography', name: 'Diagnostic Angiography' },
      { id: 'angioplasty', name: 'Angioplasty (PTA)' },
      { id: 'stent-placement', name: 'Stent Placement (Arterial / Venous)' },
      { id: 'thrombolysis', name: 'Thrombolysis / Thrombectomy' },
      { id: 'embolization-hemorrhage', name: 'Embolization – Hemorrhage' },
      { id: 'embolization-ufe', name: 'Embolization – Uterine Fibroid (UFE)' },
      { id: 'embolization-varicocele', name: 'Embolization – Varicocele' },
      { id: 'ivc-filter', name: 'IVC Filter Placement' },
      { id: 'tips', name: 'TIPS Procedure' },
    ]
  },
  {
    id: 'ir-biopsy-drainage',
    name: 'IR: Biopsy & Drainage',
    nameAr: 'أشعة تداخلية: خزعة وتصريف',
    tests: [
      { id: 'ir-biopsy', name: 'Image-Guided Biopsy' },
      { id: 'ir-abscess-drainage', name: 'Abscess Drainage (Percutaneous)' },
      { id: 'ir-paracentesis', name: 'Paracentesis (Image-Guided)' },
      { id: 'ir-thoracentesis', name: 'Thoracentesis (Image-Guided)' },
      { id: 'ir-nephrostomy', name: 'Percutaneous Nephrostomy' },
      { id: 'ir-cholecystostomy', name: 'Percutaneous Cholecystostomy' },
    ]
  },
  {
    id: 'ir-ablation-other',
    name: 'IR: Ablation & Other',
    nameAr: 'أشعة تداخلية: استئصال وأخرى',
    tests: [
      { id: 'rfa', name: 'Radiofrequency Ablation (RFA)' },
      { id: 'mwa', name: 'Microwave Ablation (MWA)' },
      { id: 'cryoablation', name: 'Cryoablation' },
      { id: 'vertebroplasty', name: 'Vertebroplasty' },
      { id: 'kyphoplasty', name: 'Kyphoplasty' },
      { id: 'tace', name: 'TACE (Transarterial Chemoembolization)' },
      { id: 'y90-radioembolization', name: 'Y-90 Radioembolization (SIRT)' },
      { id: 'ptc-biliary', name: 'PTC / Biliary Drainage' },
      { id: 'central-line', name: 'Central Venous Catheter Placement' },
      { id: 'port-placement', name: 'Implanted Port Placement (Port-a-Cath)' },
      { id: 'picc-line', name: 'PICC Line Placement' },
    ]
  },

  // ===================== DEXA =====================
  {
    id: 'dexa',
    name: 'DEXA (Bone Densitometry)',
    nameAr: 'قياس كثافة العظام',
    tests: [
      { id: 'dexa-lumbar', name: 'DEXA – Lumbar Spine' },
      { id: 'dexa-hip', name: 'DEXA – Hip (Femoral Neck)' },
      { id: 'dexa-forearm', name: 'DEXA – Forearm (Distal Radius)' },
      { id: 'dexa-whole-body', name: 'DEXA – Whole Body Composition' },
    ]
  },

  // ===================== DENTAL =====================
  {
    id: 'dental',
    name: 'Dental & Maxillofacial',
    nameAr: 'أشعة الأسنان والفكين',
    tests: [
      { id: 'dental-panoramic', name: 'Dental Panoramic (OPG)' },
      { id: 'dental-periapical', name: 'Dental Periapical Radiograph' },
      { id: 'dental-cbct', name: 'Cone-Beam CT (CBCT)' },
      { id: 'dental-cephalometric', name: 'Cephalometric Radiograph' },
    ]
  },

  // ===================== OTHERS =====================
  {
    id: 'others',
    name: 'Others',
    nameAr: 'أخرى',
    tests: []
  },
];
