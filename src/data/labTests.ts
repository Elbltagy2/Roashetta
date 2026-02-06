export interface LabTest {
  id: string;
  name: string;
}

export interface LabTestCategory {
  id: string;
  name: string;
  nameAr: string;
  tests: LabTest[];
}

export const LAB_TEST_CATEGORIES: LabTestCategory[] = [
  // Column 1
  {
    id: 'inflammation',
    name: 'Inflammation',
    nameAr: 'الالتهاب',
    tests: [
      { id: 'crp', name: 'CRP' },
      { id: 'procalcitonin', name: 'Procalcitonin' },
    ]
  },
  {
    id: 'blood-gases',
    name: 'Blood Gases',
    nameAr: 'غازات الدم',
    tests: [
      { id: 'abg', name: 'ABG' },
      { id: 'vbg', name: 'VBG' },
      { id: 'lactate', name: 'Lactate' },
    ]
  },
  {
    id: 'liver-function',
    name: 'Liver Function',
    nameAr: 'وظائف الكبد',
    tests: [
      { id: 'bil-t', name: 'Bil (T)' },
      { id: 'bil-d', name: 'Bil (D)' },
      { id: 'ast', name: 'AST' },
      { id: 'alt', name: 'ALT' },
      { id: 'alb', name: 'ALB' },
      { id: 'tp', name: 'TP' },
      { id: 'ggt', name: 'GGT' },
      { id: 'alk-ph', name: 'Alk Ph' },
      { id: 'amylase', name: 'Amylase' },
      { id: 'lipase', name: 'Lipase' },
    ]
  },
  {
    id: 'kidney-function',
    name: 'Kidney Function',
    nameAr: 'وظائف الكلى',
    tests: [
      { id: 'creatinine', name: 'Creatinine' },
      { id: 'urea', name: 'Urea' },
      { id: 'uric-acid', name: 'Uric acid' },
      { id: 'egfr', name: 'eGFR' },
      { id: 'na', name: 'Na' },
      { id: 'k', name: 'K' },
      { id: 'ca-total', name: 'Ca (Total)' },
      { id: 'ca-ionized', name: 'Ca (Ionized)' },
      { id: 'mg', name: 'Mg' },
      { id: 'phosphorus', name: 'Phosphorus' },
    ]
  },
  {
    id: 'cardiac-profile',
    name: 'Cardiac Profile',
    nameAr: 'وظائف القلب',
    tests: [
      { id: 'ck-mb', name: 'CK-MB' },
      { id: 'ck-total', name: 'CK-Total' },
      { id: 'troponin-i', name: 'Troponin I' },
      { id: 'myoglobin', name: 'Myoglobin' },
    ]
  },
  {
    id: 'lipid-profile',
    name: 'Lipid Profile',
    nameAr: 'الدهون',
    tests: [
      { id: 'cholesterol', name: 'Cholesterol' },
      { id: 'hdl', name: 'HDL' },
      { id: 'ldl', name: 'LDL' },
      { id: 'triglycerides', name: 'Triglycerides' },
      { id: 'vldl', name: 'VLDL' },
    ]
  },
  {
    id: 'diabetes-profile',
    name: 'Diabetes Profile',
    nameAr: 'السكر',
    tests: [
      { id: 'fbs', name: 'FBS' },
      { id: '2hrpp', name: '2HrPP' },
      { id: 'rbs', name: 'RBS' },
      { id: 'hba1c', name: 'HbA1c' },
      { id: 'insulin', name: 'Insulin' },
      { id: 'c-peptide', name: 'C-Peptide' },
      { id: 'eag', name: 'eAG' },
      { id: 'ogct', name: 'OGCT' },
    ]
  },
  {
    id: 'hematology',
    name: 'Hematology',
    nameAr: 'أمراض الدم',
    tests: [
      { id: 'cbc', name: 'CBC' },
      { id: 'esr', name: 'ESR' },
      { id: 'abo-rh', name: 'ABO/RH' },
      { id: 'fe', name: 'Fe' },
      { id: 'tibc', name: 'TIBC' },
      { id: 'ferritin', name: 'Ferritin' },
      { id: 'ldh', name: 'LDH' },
      { id: 'erythropoietin', name: 'Erythropoietin' },
      { id: 'haptoglobin', name: 'Haptoglobin' },
      { id: 'reticulocyte-count', name: 'Reticulocyte count' },
      { id: 'coombs-direct', name: 'Coombs Direct' },
      { id: 'coombs-indirect', name: 'Coombs Indirect' },
      { id: 'g6pd-qualitative', name: 'G6PD Qualitative' },
      { id: 'g6pd-quantitative', name: 'G6PD Quantitative' },
      { id: 'pyruvate-kinase', name: 'Pyruvate Kinase' },
      { id: 'hb-electrophoresis', name: 'HB electrophoresis' },
    ]
  },
  {
    id: 'multiple-myeloma',
    name: 'Multiple Myeloma',
    nameAr: 'الورم النقوي',
    tests: [
      { id: 'spep', name: 'SPEP' },
      { id: 'immunofixation', name: 'Immunofixation' },
      { id: 'quantitative-immunoglobulin', name: 'Quantitative immunoglobulin' },
    ]
  },
  // Column 2 - Hormones
  {
    id: 'thyroid',
    name: 'Thyroid',
    nameAr: 'الغدة الدرقية',
    tests: [
      { id: 't3', name: 'T3' },
      { id: 'free-t3', name: 'Free T3' },
      { id: 't4', name: 'T4' },
      { id: 'free-t4', name: 'Free T4' },
      { id: 'tsh', name: 'TSH' },
      { id: 'fti', name: 'FTI' },
      { id: 'tbg', name: 'TBG' },
      { id: 'calcitonin', name: 'Calcitonin' },
      { id: 'thyroid-autoantibodies', name: 'Thyroid Autoantibodies' },
      { id: 'nse', name: 'NSE' },
    ]
  },
  {
    id: 'parathyroid',
    name: 'Parathyroid',
    nameAr: 'الغدة جار الدرقية',
    tests: [
      { id: 'pth-intact', name: 'PH (Intact)' },
    ]
  },
  {
    id: 'infertility',
    name: 'Infertility',
    nameAr: 'العقم',
    tests: [
      { id: 'psh', name: 'PSH' },
      { id: 'lh', name: 'LH' },
      { id: 'prl', name: 'PRL' },
      { id: 'e2', name: 'E2' },
      { id: 'testosterone', name: 'Testosterone' },
      { id: 'free-testosterone', name: 'Free Testosterone' },
      { id: 'fsh', name: 'FSH' },
      { id: 'progesterone', name: 'Progesterone' },
      { id: 'dht-dhea-dhea-s', name: 'DHT-DHEA-DHEA-S' },
    ]
  },
  {
    id: 'pregnancy',
    name: 'Pregnancy',
    nameAr: 'الحمل',
    tests: [
      { id: 'b-hcg-qualitative', name: 'B-hCG Qualitative' },
      { id: 'b-hcg-quantitative', name: 'B-hCG Quantitative' },
    ]
  },
  {
    id: 'hypertension',
    name: 'Hypertension',
    nameAr: 'ارتفاع ضغط الدم',
    tests: [
      { id: 'renin', name: 'Renin' },
      { id: 'vma', name: 'VMA' },
      { id: 'aldosterone', name: 'Aldosterone' },
      { id: 'catecholamine', name: 'Catecholamine' },
      { id: 'adrenaline', name: 'Adrenaline' },
      { id: 'noradrenaline', name: 'Noradrenaline' },
      { id: 'dopamine', name: 'Dopamine' },
      { id: 'metanephirine', name: 'Metanephirine' },
      { id: 'cortisol-am-pm', name: 'Cortisol AM / PM' },
    ]
  },
  {
    id: 'pituitary',
    name: 'Pituitary',
    nameAr: 'الغدة النخامية',
    tests: [
      { id: 'acth', name: 'ACTH' },
      { id: 'gh', name: 'GH' },
    ]
  },
  // Column 2 - Infectious Disease
  {
    id: 'infectious-disease',
    name: 'Infectious Disease',
    nameAr: 'الأمراض المعدية',
    tests: [
      { id: 'tb-dna-pcr', name: 'TB-DNA by PCR' },
      { id: 'quantiferon-tb', name: 'QuantiFERON-TB gold plus' },
      { id: 'typhoid-widal', name: 'Typhoid: Widal' },
      { id: 'brucella-serology', name: 'Brucella: Serology' },
      { id: 'chlamydia-antigen', name: 'Chlamydia: Antigen' },
      { id: 'chlamydia-antibody', name: 'Chlamydia: Antibody' },
      { id: 'syphilis-tpha', name: 'Syphilis: TPHA' },
      { id: 'syphilis-vdrl', name: 'Syphilis: VDRL' },
      { id: 'syphilis-rpr', name: 'Syphilis: RPR' },
      { id: 'syphilis-fta', name: 'Syphilis: FTA' },
      { id: 'helicobacter-saliva', name: 'Helicobacter: Saliva' },
      { id: 'helicobacter-serology', name: 'Helicobacter: Serology' },
      { id: 'helicobacter-igg-iga-ab', name: 'Helicobacter: IgG / IgA Ab' },
    ]
  },
  // Column 2 - Virology
  {
    id: 'virology',
    name: 'Virology',
    nameAr: 'الفيروسات',
    tests: [
      { id: 'sars-cov2-rapid-ag', name: 'SARS-Cov-2: Rapid Test (Ag)' },
      { id: 'sars-cov2-ab-igm-igg', name: 'SARS-Cov-2: Ab IgM / IgG' },
      { id: 'sars-cov2-rt-pcr', name: 'SARS-Cov-2: rt-PCR' },
      { id: 'h1n1-real-time', name: 'H1N1: Real time' },
      { id: 'h1n1-pcr-screening', name: 'H1N1: PCR Screening A/B' },
      { id: 'hpv-pcr', name: 'Human papillomavirus: HPV-PCR' },
      { id: 'hsv1-igm-igg', name: 'HSV(I): IgM / IgG' },
      { id: 'hsv1-pcr', name: 'HSV(I): PCR' },
      { id: 'hsv2-igm-igg', name: 'HSV(II): IgM / IgG' },
      { id: 'hsv2-pcr', name: 'HSV(II): PCR' },
      { id: 'ebv-vca-igm', name: 'EBV: VCA-IgM' },
      { id: 'ebv-vca-igg', name: 'EBV: VCA-IgG' },
      { id: 'ebna-igg', name: 'EBNA-IgG' },
      { id: 'hiv-ag-ab', name: 'AIDS: HIV Ag / Ab' },
      { id: 'hiv-pcr', name: 'AIDS: HIV PCR' },
    ]
  },
  {
    id: 'hepatitis',
    name: 'Hepatitis Markers',
    nameAr: 'التهاب الكبد',
    tests: [
      { id: 'hav-igm', name: 'HAV: HAV-IgM' },
      { id: 'hav-total', name: 'HAV: HAV total' },
      { id: 'hbsag', name: 'HBV: HBsAg' },
      { id: 'hbsab', name: 'HBV: HBsAb' },
      { id: 'hbc-igm', name: 'HBV: HBc IgM' },
      { id: 'hbc-total', name: 'HBV: HBc total' },
      { id: 'hbeag', name: 'HBV: HBeAg' },
      { id: 'hbeab', name: 'HBV: HBeAb' },
      { id: 'hcv-igg', name: 'HCV: HCV-IgG' },
      { id: 'hcv-lia', name: 'HCV: LIA' },
      { id: 'hcv-rna-rt-pcr', name: 'HCV: HCV-RNA rt-PCR' },
    ]
  },
  // Column 2 - Autoantibodies
  {
    id: 'autoantibodies',
    name: 'Autoantibodies',
    nameAr: 'الأجسام المضادة الذاتية',
    tests: [
      { id: 'c3', name: 'C3' },
      { id: 'c4', name: 'C4' },
      { id: 'rf', name: 'RF' },
      { id: 'amyloid-a', name: 'Amyloid a' },
      { id: 'ana', name: 'ANA' },
      { id: 'dsdna', name: 'dsDNA' },
      { id: 'asma', name: 'ASMA' },
      { id: 'anti-ccp', name: 'Anti-ccp' },
      { id: 'apca', name: 'APCA' },
      { id: 'rana', name: 'RANA' },
      { id: 'ssb-la', name: 'SSb(La)' },
      { id: 'ssa-ro', name: 'SSA(Ro)' },
      { id: 'scl-70', name: 'SCL-70' },
      { id: 'anca', name: 'ANCA' },
      { id: 'lkm-jo-1', name: 'LKM JO-1' },
      { id: 'histone', name: 'Histone' },
      { id: 'antisperm-ab', name: 'Antisperm Ab (Ig Total/IgG/IgA)' },
      { id: 'antigliadine-ab', name: 'AntiGliadine Ab' },
      { id: 'anti-myosin-ab', name: 'Anti-Myosin Ab' },
      { id: 'homa-test', name: 'Homa Test (Insulin Resistance)' },
      { id: 'anti-insulin-ab', name: 'Anti-Insulin Ab' },
      { id: 'anti-thyroid-ab', name: 'Anti-thyroid Ab' },
      { id: 'anti-intrinsic-factor', name: 'Anti-Intrinsic factor' },
      { id: 'hla-b27-b5', name: 'HLA(B27 - B5)' },
      { id: 'autoantibody-profile', name: 'Autoantibody profile' },
      { id: 'ige-total-specific', name: 'IgE total/specific (RAST)' },
    ]
  },
  // Column 2 - Vitamins
  {
    id: 'vitamins',
    name: 'Vitamins',
    nameAr: 'الفيتامينات',
    tests: [
      { id: 'vit-d-1-25-oh', name: 'Vit D (1.25 OH)' },
      { id: 'vit-d3-25-oh', name: 'Vit D3 (25 OH)' },
      { id: 'serum-b12', name: 'Serum B12' },
      { id: 'folate', name: 'Folate' },
    ]
  },
  // Column 3
  {
    id: 'hemostatic-profile',
    name: 'Hemostatic Profile',
    nameAr: 'تخثر الدم',
    tests: [
      { id: 'pt', name: 'PT' },
      { id: 'aptt', name: 'aPTT' },
      { id: 'fibrinogen', name: 'Fibrinogen' },
      { id: 'd-dimer', name: 'D-Dimer' },
      { id: 'fdps', name: "FDP's" },
      { id: 'platelet-abs', name: 'Platelet Abs (Direct/ Indirect)' },
    ]
  },
  {
    id: 'thrombophilia',
    name: 'Thrombophilia',
    nameAr: 'التخثر',
    tests: [
      { id: 'protein-c', name: 'Protein C' },
      { id: 'protein-s', name: 'Protein S' },
      { id: 'anti-throm-iii', name: 'Anti Throm III' },
      { id: 'factor-v-leiden', name: 'Factor V Leiden' },
      { id: 'lupus-anticoag', name: 'Lupus Anticoag' },
      { id: 'apcr', name: 'APCR' },
      { id: 'anti-phospholipid-ab-igg', name: 'Anti-Phospholipid Ab IgG' },
      { id: 'antib2-glycoprotein', name: 'AntiB2 Glycoprotein' },
      { id: 'homocysteine', name: 'Homocysteine' },
      { id: 'anti-cardiolipin', name: 'Anti Cardiolipin (IgG/IgM)' },
      { id: 'factor-assay', name: 'Factor Assay' },
    ]
  },
  {
    id: 'tumor-markers',
    name: 'Tumor Markers',
    nameAr: 'دلالات الأورام',
    tests: [
      { id: 'psa-total', name: 'Prostate: PSA (Total)' },
      { id: 'psa-free', name: 'Prostate: PSA (Free)' },
      { id: 'pap', name: 'Prostate: PAP' },
      { id: 'breast-ca15-3', name: 'Breast: CA 15.3' },
      { id: 'breast-cea', name: 'Breast: CEA' },
      { id: 'estrog-progest-receptors', name: 'Estrog/ Progest Receptors' },
      { id: 'bladder-tpa', name: 'Bladder: TPA' },
      { id: 'bladder-tps', name: 'Bladder: TPS' },
      { id: 'bladder-cea', name: 'Bladder: CEA' },
      { id: 'bladder-ca50', name: 'Bladder: CA50' },
      { id: 'cervix-scc', name: 'Cervix/Uterus: SCC' },
      { id: 'cervix-cea', name: 'Cervix/Uterus: CEA' },
      { id: 'cervix-tpa', name: 'Cervix/Uterus: TPA' },
      { id: 'cervix-tps', name: 'Cervix/Uterus: TPS' },
      { id: 'ovary-ca125', name: 'Ovary: CA125' },
      { id: 'ovary-ca72-4', name: 'Ovary: CA72.4' },
      { id: 'liver-cea', name: 'Liver: CEA' },
      { id: 'liver-afp', name: 'Liver: AFP' },
      { id: 'liver-ca19-9', name: 'Liver: CA19.9' },
      { id: 'liver-pivkaii', name: 'Liver: PIVKAII' },
      { id: 'git-cea', name: 'GIT: CEA' },
      { id: 'git-ca19-9', name: 'GIT: CA19.9' },
      { id: 'git-tpa', name: 'GIT: TPA' },
    ]
  },
  {
    id: 'toxicology-profile',
    name: 'Toxicology Profile',
    nameAr: 'السموم',
    tests: [
      { id: 'rapa-immune', name: 'Rapa Immune' },
      { id: 'lithium', name: 'Lithium' },
      { id: 'digoxin', name: 'Digoxin' },
      { id: 'theophylline', name: 'Theophylline' },
      { id: 'methotrexate', name: 'Methotrexate' },
      { id: 'cyclosporine', name: 'Cyclosporine' },
      { id: 'fk506', name: 'FK506' },
      { id: 'other-drugs', name: 'Other Drugs' },
    ]
  },
  {
    id: 'stool-tests',
    name: 'Stool Tests',
    nameAr: 'فحص البراز',
    tests: [
      { id: 'stool', name: 'Stool' },
      { id: 'occult-blood', name: 'Occult blood in stool' },
      { id: 'rotavirus', name: 'Rotavirus' },
      { id: 'helicobacter-ag', name: 'Helicobacter Ag' },
      { id: 'reducing-sugar', name: 'Reducing Sugar' },
      { id: 'calprotectin', name: 'Calprotectin' },
    ]
  },
  {
    id: 'urine-tests',
    name: 'Urine Tests',
    nameAr: 'فحص البول',
    tests: [
      { id: 'urine', name: 'Urine' },
      { id: 'micro-albuminuria', name: 'Micro albuminuria' },
      { id: 'acr', name: 'ACR' },
      { id: 'protein-creatinine-ratio', name: 'Protein/ Creatinine ratio' },
      { id: 'b-hcg-pregnancy', name: 'B-hCG Pregnancy' },
      { id: 'bj-protein', name: 'BJ Protein' },
      { id: 'drugs-of-abuse', name: 'Drugs of Abuse' },
    ]
  },
  {
    id: 'biological-fluids',
    name: 'Biological Fluids',
    nameAr: 'السوائل البيولوجية',
    tests: [
      { id: 'csf', name: 'CSF' },
      { id: 'pleural', name: 'Pleural' },
      { id: 'ascitic', name: 'Ascitic' },
      { id: 'synovial', name: 'Synovial' },
      { id: 'adenosine-deaminase', name: 'Adenosine deaminase' },
      { id: 'semen', name: 'Semen' },
    ]
  },
  {
    id: 'cystogenetics',
    name: 'Cystogenetics',
    nameAr: 'الوراثة',
    tests: [
      { id: 'karyotypin', name: 'Karyotypin' },
      { id: 'down-syndrome', name: 'Down syndrome' },
    ]
  },
  {
    id: 'others',
    name: 'Others',
    nameAr: 'أخرى',
    tests: []
  },
];

// Helper function to get all test IDs
export const getAllTestIds = (): string[] => {
  const ids: string[] = [];
  LAB_TEST_CATEGORIES.forEach(category => {
    category.tests.forEach(test => {
      ids.push(test.id);
    });
  });
  return ids;
};

// Helper function to find a test by ID
export const findTestById = (testId: string): { category: LabTestCategory; test: LabTest } | null => {
  for (const category of LAB_TEST_CATEGORIES) {
    const test = category.tests.find(t => t.id === testId);
    if (test) {
      return { category, test };
    }
  }
  return null;
};
