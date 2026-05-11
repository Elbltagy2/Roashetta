import { ChecklistCategory } from '@/components/visit/CheckboxRequestForm';

export const FAMILY_HISTORY_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'cardiovascular',
    name: 'Cardiovascular',
    nameAr: 'أمراض القلب',
    tests: [
      { id: 'fh-hypertension', name: 'Hypertension' },
      { id: 'fh-coronary-artery-disease-mi', name: 'Coronary Artery Disease/MI' },
      { id: 'fh-stroke', name: 'Stroke' },
      { id: 'fh-hyperlipidemia', name: 'Hyperlipidemia' },
      { id: 'fh-congenital-heart-disease', name: 'Congenital Heart Disease' },
      { id: 'fh-sudden-cardiac-death', name: 'Sudden Cardiac Death' },
    ],
  },
  {
    id: 'metabolic',
    name: 'Metabolic',
    nameAr: 'أمراض الأيض',
    tests: [
      { id: 'fh-diabetes-mellitus', name: 'Diabetes Mellitus' },
      { id: 'fh-thyroid-disease', name: 'Thyroid Disease' },
      { id: 'fh-obesity', name: 'Obesity' },
      { id: 'fh-gout', name: 'Gout' },
    ],
  },
  {
    id: 'oncological',
    name: 'Oncological',
    nameAr: 'أورام',
    tests: [
      { id: 'fh-colon-cancer', name: 'Colon Cancer' },
      { id: 'fh-breast-cancer', name: 'Breast Cancer' },
      { id: 'fh-ovarian-cancer', name: 'Ovarian Cancer' },
      { id: 'fh-prostate-cancer', name: 'Prostate Cancer' },
      { id: 'fh-lung-cancer', name: 'Lung Cancer' },
      { id: 'fh-gastric-cancer', name: 'Gastric Cancer' },
      { id: 'fh-pancreatic-cancer', name: 'Pancreatic Cancer' },
      { id: 'fh-leukemia-lymphoma', name: 'Leukemia/Lymphoma' },
    ],
  },
  {
    id: 'renal',
    name: 'Renal',
    nameAr: 'أمراض الكلى',
    tests: [
      { id: 'fh-chronic-kidney-disease', name: 'Chronic Kidney Disease' },
      { id: 'fh-polycystic-kidney-disease', name: 'Polycystic Kidney Disease' },
      { id: 'fh-renal-calculi', name: 'Renal Calculi' },
    ],
  },
  {
    id: 'hematological',
    name: 'Hematological',
    nameAr: 'أمراض الدم',
    tests: [
      { id: 'fh-sickle-cell-disease', name: 'Sickle Cell Disease' },
      { id: 'fh-thalassemia', name: 'Thalassemia' },
      { id: 'fh-hemophilia', name: 'Hemophilia' },
      { id: 'fh-g6pd-deficiency', name: 'G6PD Deficiency' },
    ],
  },
  {
    id: 'neurological',
    name: 'Neurological',
    nameAr: 'أمراض عصبية',
    tests: [
      { id: 'fh-epilepsy', name: 'Epilepsy' },
      { id: 'fh-migraine', name: 'Migraine' },
      { id: 'fh-parkinson-disease', name: 'Parkinson Disease' },
      { id: 'fh-alzheimer-dementia', name: 'Alzheimer/Dementia' },
      { id: 'fh-multiple-sclerosis', name: 'Multiple Sclerosis' },
    ],
  },
  {
    id: 'psychiatric',
    name: 'Psychiatric',
    nameAr: 'أمراض نفسية',
    tests: [
      { id: 'fh-depression', name: 'Depression' },
      { id: 'fh-schizophrenia', name: 'Schizophrenia' },
      { id: 'fh-bipolar-disorder', name: 'Bipolar Disorder' },
      { id: 'fh-anxiety-disorder', name: 'Anxiety Disorder' },
    ],
  },
  {
    id: 'rheumatological',
    name: 'Rheumatological',
    nameAr: 'أمراض الروماتيزم',
    tests: [
      { id: 'fh-rheumatoid-arthritis', name: 'Rheumatoid Arthritis' },
      { id: 'fh-sle', name: 'SLE' },
      { id: 'fh-ankylosing-spondylitis', name: 'Ankylosing Spondylitis' },
    ],
  },
  {
    id: 'genetic-congenital',
    name: 'Genetic/Congenital',
    nameAr: 'أمراض وراثية',
    tests: [
      { id: 'fh-down-syndrome', name: 'Down Syndrome' },
      { id: 'fh-cystic-fibrosis', name: 'Cystic Fibrosis' },
      { id: 'fh-marfan-syndrome', name: 'Marfan Syndrome' },
      { id: 'fh-familial-hypercholesterolemia', name: 'Familial Hypercholesterolemia' },
    ],
  },
  {
    id: 'others',
    name: 'Others',
    nameAr: 'أخرى',
    tests: [],
  },
];
