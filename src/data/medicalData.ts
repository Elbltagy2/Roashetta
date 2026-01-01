// Egyptian Essential Medicine List 2025 - For Autocomplete
export const commonMedicines = [
  // Anesthetics & Preoperative
  { name: 'أيزوفلورين', nameEn: 'Isoflurane', dosages: ['استنشاق'] },
  { name: 'أكسيد النيتروز', nameEn: 'Nitrous Oxide', dosages: ['استنشاق'] },
  { name: 'سيفوفلورين', nameEn: 'Sevoflurane', dosages: ['استنشاق'] },
  { name: 'كيتامين', nameEn: 'Ketamine', dosages: ['50mg/ml'] },
  { name: 'بروبوفول', nameEn: 'Propofol', dosages: ['10mg/ml', '20mg/ml'] },
  { name: 'بوبيفاكين', nameEn: 'Bupivacaine', dosages: ['0.5%'] },
  { name: 'ليدوكايين', nameEn: 'Lidocaine', dosages: ['1%', '2%'] },
  { name: 'إيفيدرين', nameEn: 'Ephedrine', dosages: ['30mg/ml'] },
  { name: 'أتروبين', nameEn: 'Atropine', dosages: ['1mg/ml'] },
  { name: 'ميدازولام', nameEn: 'Midazolam', dosages: ['5mg/ml', '7.5mg'] },
  { name: 'مورفين', nameEn: 'Morphine', dosages: ['5mg/ml', '10mg/ml'] },
  { name: 'بيثيدين', nameEn: 'Pethidine', dosages: ['100mg/2ml'] },

  // Pain & NSAIDs
  { name: 'أسبرين', nameEn: 'Acetylsalicylic Acid', dosages: ['75mg', '100mg', '300mg', '500mg'] },
  { name: 'إيبوبروفين', nameEn: 'Ibuprofen', dosages: ['200mg', '400mg', '600mg'] },
  { name: 'باراسيتامول', nameEn: 'Paracetamol', dosages: ['250mg', '500mg', '1000mg'] },
  { name: 'ديكلوفيناك', nameEn: 'Diclofenac', dosages: ['25mg', '50mg', '75mg'] },
  { name: 'كيتوبروفين', nameEn: 'Ketoprofen', dosages: ['25mg', '50mg', '100mg'] },
  { name: 'أوكسيكودون', nameEn: 'Oxycodone', dosages: ['5mg', '10mg'] },
  { name: 'فنتانيل', nameEn: 'Fentanyl', dosages: ['12mcg/hr', '25mcg/hr', '50mcg/hr'] },
  { name: 'ميثادون', nameEn: 'Methadone', dosages: ['5mg', '10mg'] },
  { name: 'ترامادول', nameEn: 'Tramadol', dosages: ['50mg', '100mg'] },
  { name: 'نالبوفين', nameEn: 'Nalbuphine', dosages: ['20mg/ml'] },

  // Palliative Care
  { name: 'أميتريبتيلين', nameEn: 'Amitriptyline', dosages: ['10mg', '25mg', '50mg'] },
  { name: 'سيكليزين', nameEn: 'Cyclizine', dosages: ['50mg/ml'] },
  { name: 'ديازيبام', nameEn: 'Diazepam', dosages: ['2mg', '5mg', '10mg'] },
  { name: 'لوبيراميد', nameEn: 'Loperamide', dosages: ['2mg'] },
  { name: 'ميتوكلوبراميد', nameEn: 'Metoclopramide', dosages: ['5mg/ml', '10mg'] },
  { name: 'أوندانسيترون', nameEn: 'Ondansetron', dosages: ['2mg/ml', '4mg', '8mg'] },

  // Antiallergics
  { name: 'كلورفينيرامين', nameEn: 'Chlorpheniramine', dosages: ['4mg'] },
  { name: 'ديكساميثازون', nameEn: 'Dexamethasone', dosages: ['0.5mg', '0.75mg', '4mg', '8mg'] },
  { name: 'بريدنيزولون', nameEn: 'Prednisolone', dosages: ['5mg', '10mg', '20mg'] },
  { name: 'هيدروكورتيزون', nameEn: 'Hydrocortisone', dosages: ['10mg', '100mg', '250mg'] },
  { name: 'إبينفرين', nameEn: 'Epinephrine', dosages: ['1mg/ml'] },
  { name: 'لوراتادين', nameEn: 'Loratadine', dosages: ['10mg'] },
  { name: 'سيتريزين', nameEn: 'Cetirizine', dosages: ['10mg'] },
  { name: 'فيكسوفينادين', nameEn: 'Fexofenadine', dosages: ['120mg', '180mg'] },

  // Antidotes
  { name: 'فحم نشط', nameEn: 'Activated Charcoal', dosages: ['25g'] },
  { name: 'أسيتيل سيستين', nameEn: 'Acetylcysteine', dosages: ['200mg', '600mg'] },
  { name: 'فلومازينيل', nameEn: 'Flumazenil', dosages: ['0.1mg/ml'] },
  { name: 'كالسيوم جلوكونات', nameEn: 'Calcium Gluconate', dosages: ['100mg/ml'] },

  // Antiseizure
  { name: 'كاربامازيبين', nameEn: 'Carbamazepine', dosages: ['100mg', '200mg', '400mg'] },
  { name: 'ليفيتيراسيتام', nameEn: 'Levetiracetam', dosages: ['250mg', '500mg', '750mg', '1000mg'] },
  { name: 'لاموتريجين', nameEn: 'Lamotrigine', dosages: ['25mg', '50mg', '100mg', '200mg'] },
  { name: 'كبريتات الماغنسيوم', nameEn: 'Magnesium Sulfate', dosages: ['10%', '50%'] },
  { name: 'جابابنتين', nameEn: 'Gabapentin', dosages: ['100mg', '300mg', '400mg', '600mg', '800mg'] },
  { name: 'حمض الفالبرويك', nameEn: 'Valproic Acid', dosages: ['200mg', '250mg', '500mg'] },
  { name: 'فينوباربيتال', nameEn: 'Phenobarbital', dosages: ['15mg', '60mg', '100mg'] },
  { name: 'فينيتوين', nameEn: 'Phenytoin', dosages: ['50mg', '100mg'] },
  { name: 'توبيراميت', nameEn: 'Topiramate', dosages: ['25mg', '50mg'] },

  // Parkinson
  { name: 'ليفودوبا + كاربيدوبا', nameEn: 'Levodopa + Carbidopa', dosages: ['250mg+25mg'] },
  { name: 'بنزتروبين', nameEn: 'Benztropine', dosages: ['2mg'] },

  // Antibiotics - Penicillins
  { name: 'أموكسيسيلين', nameEn: 'Amoxicillin', dosages: ['250mg', '500mg', '1g'] },
  { name: 'أموكسيسيلين + كلافولانيك', nameEn: 'Amoxicillin + Clavulanic Acid', dosages: ['375mg', '625mg', '1g'] },
  { name: 'أمبيسيلين', nameEn: 'Ampicillin', dosages: ['250mg', '500mg', '1g'] },
  { name: 'بنزاثين بنسلين', nameEn: 'Benzathine Benzylpenicillin', dosages: ['1.2 M.I.U'] },
  { name: 'بنسلين جي', nameEn: 'Benzylpenicillin', dosages: ['1 M.I.U'] },
  { name: 'فينوكسي ميثيل بنسلين', nameEn: 'Phenoxymethylpenicillin', dosages: ['250mg'] },

  // Antibiotics - Cephalosporins
  { name: 'سيفالكسين', nameEn: 'Cefalexin', dosages: ['250mg', '500mg'] },
  { name: 'سيفازولين', nameEn: 'Cefazolin', dosages: ['500mg', '1g'] },
  { name: 'سيفيكسيم', nameEn: 'Cefixime', dosages: ['200mg', '400mg'] },
  { name: 'سيفوتاكسيم', nameEn: 'Cefotaxime', dosages: ['250mg', '500mg', '1g'] },
  { name: 'سيفترياكسون', nameEn: 'Ceftriaxone', dosages: ['250mg', '500mg', '1g'] },
  { name: 'سيفتازيديم', nameEn: 'Ceftazidime', dosages: ['250mg', '500mg', '1g'] },

  // Antibiotics - Macrolides
  { name: 'أزيثروميسين', nameEn: 'Azithromycin', dosages: ['250mg', '500mg'] },
  { name: 'كلاريثروميسين', nameEn: 'Clarithromycin', dosages: ['250mg', '500mg'] },

  // Antibiotics - Fluoroquinolones
  { name: 'سيبروفلوكساسين', nameEn: 'Ciprofloxacin', dosages: ['250mg', '500mg', '750mg'] },
  { name: 'ليفوفلوكساسين', nameEn: 'Levofloxacin', dosages: ['250mg', '500mg', '750mg'] },
  { name: 'موكسيفلوكساسين', nameEn: 'Moxifloxacin', dosages: ['400mg'] },

  // Antibiotics - Others
  { name: 'كليندامايسين', nameEn: 'Clindamycin', dosages: ['150mg', '300mg'] },
  { name: 'دوكسيسيكلين', nameEn: 'Doxycycline', dosages: ['50mg', '100mg'] },
  { name: 'جنتاميسين', nameEn: 'Gentamicin', dosages: ['10mg/ml', '40mg/ml'] },
  { name: 'ميترونيدازول', nameEn: 'Metronidazole', dosages: ['250mg', '500mg'] },
  { name: 'نيتروفورانتوين', nameEn: 'Nitrofurantoin', dosages: ['50mg', '100mg'] },
  { name: 'أميكاسين', nameEn: 'Amikacin', dosages: ['50mg/ml', '250mg/ml'] },
  { name: 'سلفاميثوكسازول + تريميثوبريم', nameEn: 'Sulfamethoxazole + Trimethoprim', dosages: ['400mg+80mg', '800mg+160mg'] },
  { name: 'بيبيراسيلين + تازوباكتام', nameEn: 'Piperacillin + Tazobactam', dosages: ['2g+250mg', '4g+500mg'] },
  { name: 'فانكومايسين', nameEn: 'Vancomycin', dosages: ['500mg', '1g'] },
  { name: 'ميروبينيم', nameEn: 'Meropenem', dosages: ['500mg', '1g'] },
  { name: 'كوليستين', nameEn: 'Colistin', dosages: ['1 M.I.U'] },
  { name: 'لينزوليد', nameEn: 'Linezolid', dosages: ['600mg'] },

  // Antituberculosis
  { name: 'ريفامبيسين', nameEn: 'Rifampicin', dosages: ['150mg', '300mg'] },
  { name: 'أيزونيازيد', nameEn: 'Isoniazid', dosages: ['100mg', '300mg'] },
  { name: 'بيرازيناميد', nameEn: 'Pyrazinamide', dosages: ['500mg'] },
  { name: 'إيثامبوتول', nameEn: 'Ethambutol', dosages: ['500mg'] },
  { name: 'ستربتومايسين', nameEn: 'Streptomycin', dosages: ['1g'] },

  // Antifungal
  { name: 'أمفوتريسين ب', nameEn: 'Amphotericin B', dosages: ['50mg'] },
  { name: 'كلوتريمازول', nameEn: 'Clotrimazole', dosages: ['1%', '100mg', '500mg'] },
  { name: 'فلوكونازول', nameEn: 'Fluconazole', dosages: ['50mg', '150mg', '200mg'] },
  { name: 'جريسيوفولفين', nameEn: 'Griseofulvin', dosages: ['125mg'] },
  { name: 'نيستاتين', nameEn: 'Nystatin', dosages: ['100000 U/ml'] },
  { name: 'فوريكونازول', nameEn: 'Voriconazole', dosages: ['50mg', '200mg'] },
  { name: 'إتراكونازول', nameEn: 'Itraconazole', dosages: ['100mg'] },
  { name: 'تيربينافين', nameEn: 'Terbinafine', dosages: ['250mg', '1%'] },

  // Antiviral
  { name: 'أسيكلوفير', nameEn: 'Aciclovir', dosages: ['200mg', '400mg', '800mg'] },
  { name: 'فالاسيكلوفير', nameEn: 'Valacyclovir', dosages: ['500mg'] },
  { name: 'أوسيلتاميفير', nameEn: 'Oseltamivir', dosages: ['75mg'] },
  { name: 'ريبافيرين', nameEn: 'Ribavirin', dosages: ['200mg', '400mg'] },
  { name: 'سوفوسبوفير', nameEn: 'Sofosbuvir', dosages: ['400mg'] },
  { name: 'داكلاتاسفير', nameEn: 'Daclatasvir', dosages: ['30mg', '60mg'] },
  { name: 'إنتيكافير', nameEn: 'Entecavir', dosages: ['0.5mg', '1mg'] },

  // Antiprotozoal
  { name: 'ميترونيدازول', nameEn: 'Metronidazole', dosages: ['250mg', '500mg'] },
  { name: 'تينيدازول', nameEn: 'Tinidazole', dosages: ['500mg'] },
  { name: 'كلوروكين', nameEn: 'Chloroquine', dosages: ['250mg'] },

  // Antihelminthics
  { name: 'ألبيندازول', nameEn: 'Albendazole', dosages: ['200mg', '400mg'] },
  { name: 'ميبيندازول', nameEn: 'Mebendazole', dosages: ['100mg', '500mg'] },
  { name: 'إيفرمكتين', nameEn: 'Ivermectin', dosages: ['3mg', '6mg'] },
  { name: 'برازيكوانتيل', nameEn: 'Praziquantel', dosages: ['600mg'] },

  // Antimigraine
  { name: 'سوماتريبتان', nameEn: 'Sumatriptan', dosages: ['50mg'] },
  { name: 'بروبرانولول', nameEn: 'Propranolol', dosages: ['10mg', '40mg'] },

  // Immunomodulators
  { name: 'أزاثيوبرين', nameEn: 'Azathioprine', dosages: ['25mg', '50mg'] },
  { name: 'سيكلوسبورين', nameEn: 'Ciclosporin', dosages: ['25mg', '50mg', '100mg'] },
  { name: 'تاكروليموس', nameEn: 'Tacrolimus', dosages: ['0.5mg', '1mg', '5mg'] },

  // Cardiovascular - Antianginal
  { name: 'أيزوسوربيد دينيترات', nameEn: 'Isosorbide Dinitrate', dosages: ['5mg', '10mg'] },
  { name: 'أيزوسوربيد مونونيترات', nameEn: 'Isosorbide Mononitrate', dosages: ['20mg', '40mg'] },
  { name: 'نيتروجليسرين', nameEn: 'Glyceryl Trinitrate', dosages: ['0.5mg', '2.5mg'] },

  // Cardiovascular - Beta Blockers
  { name: 'بيسوبرولول', nameEn: 'Bisoprolol', dosages: ['2.5mg', '5mg', '10mg'] },
  { name: 'كارفيديلول', nameEn: 'Carvedilol', dosages: ['6.25mg', '12.5mg', '25mg'] },
  { name: 'ميتوبرولول', nameEn: 'Metoprolol', dosages: ['50mg', '100mg'] },
  { name: 'أتينولول', nameEn: 'Atenolol', dosages: ['25mg', '50mg', '100mg'] },

  // Cardiovascular - Calcium Channel Blockers
  { name: 'أملوديبين', nameEn: 'Amlodipine', dosages: ['5mg', '10mg'] },
  { name: 'فيراباميل', nameEn: 'Verapamil', dosages: ['80mg', '240mg'] },
  { name: 'نيفيديبين', nameEn: 'Nifedipine', dosages: ['10mg', '20mg', '30mg'] },
  { name: 'ديلتيازيم', nameEn: 'Diltiazem', dosages: ['60mg', '90mg', '120mg'] },

  // Cardiovascular - ACE Inhibitors
  { name: 'إنالابريل', nameEn: 'Enalapril', dosages: ['5mg', '10mg', '20mg'] },
  { name: 'ليسينوبريل', nameEn: 'Lisinopril', dosages: ['5mg', '10mg', '20mg'] },
  { name: 'كابتوبريل', nameEn: 'Captopril', dosages: ['25mg', '50mg'] },
  { name: 'بيريندوبريل', nameEn: 'Perindopril', dosages: ['5mg', '10mg'] },
  { name: 'راميبريل', nameEn: 'Ramipril', dosages: ['2.5mg', '5mg', '10mg'] },

  // Cardiovascular - ARBs
  { name: 'لوسارتان', nameEn: 'Losartan', dosages: ['25mg', '50mg', '100mg'] },
  { name: 'فالسارتان', nameEn: 'Valsartan', dosages: ['80mg', '160mg', '320mg'] },
  { name: 'كانديسارتان', nameEn: 'Candesartan', dosages: ['8mg', '16mg', '32mg'] },
  { name: 'تيلميسارتان', nameEn: 'Telmisartan', dosages: ['40mg', '80mg'] },

  // Cardiovascular - Diuretics
  { name: 'فوروسيميد', nameEn: 'Furosemide', dosages: ['20mg', '40mg', '500mg'] },
  { name: 'هيدروكلوروثيازيد', nameEn: 'Hydrochlorothiazide', dosages: ['12.5mg', '25mg'] },
  { name: 'سبيرونولاكتون', nameEn: 'Spironolactone', dosages: ['25mg', '100mg'] },
  { name: 'إنداباميد', nameEn: 'Indapamide', dosages: ['1.5mg', '2.5mg'] },

  // Cardiovascular - Antiarrhythmic
  { name: 'ديجوكسين', nameEn: 'Digoxin', dosages: ['0.25mg'] },
  { name: 'أميودارون', nameEn: 'Amiodarone', dosages: ['200mg'] },

  // Cardiovascular - Antiplatelet & Anticoagulant
  { name: 'أسبرين', nameEn: 'Aspirin', dosages: ['75mg', '81mg', '100mg'] },
  { name: 'كلوبيدوجريل', nameEn: 'Clopidogrel', dosages: ['75mg'] },
  { name: 'تيكاجريلور', nameEn: 'Ticagrelor', dosages: ['90mg'] },
  { name: 'وارفارين', nameEn: 'Warfarin', dosages: ['1mg', '2mg', '3mg', '5mg'] },
  { name: 'هيبارين', nameEn: 'Heparin', dosages: ['5000 IU'] },
  { name: 'إينوكسابارين', nameEn: 'Enoxaparin', dosages: ['20mg', '40mg', '60mg', '80mg'] },
  { name: 'ريفاروكسابان', nameEn: 'Rivaroxaban', dosages: ['10mg', '15mg', '20mg'] },
  { name: 'أبيكسابان', nameEn: 'Apixaban', dosages: ['2.5mg', '5mg'] },

  // Cardiovascular - Statins
  { name: 'أتورفاستاتين', nameEn: 'Atorvastatin', dosages: ['10mg', '20mg', '40mg', '80mg'] },
  { name: 'سيمفاستاتين', nameEn: 'Simvastatin', dosages: ['10mg', '20mg', '40mg'] },
  { name: 'روسوفاستاتين', nameEn: 'Rosuvastatin', dosages: ['5mg', '10mg', '20mg', '40mg'] },

  // Cardiovascular - Inotropes
  { name: 'دوبامين', nameEn: 'Dopamine', dosages: ['40mg/ml'] },
  { name: 'دوبيوتامين', nameEn: 'Dobutamine', dosages: ['250mg/20ml'] },

  // Gastrointestinal - PPIs & H2 Blockers
  { name: 'أوميبرازول', nameEn: 'Omeprazole', dosages: ['20mg', '40mg'] },
  { name: 'بانتوبرازول', nameEn: 'Pantoprazole', dosages: ['20mg', '40mg'] },
  { name: 'إيزوميبرازول', nameEn: 'Esomeprazole', dosages: ['20mg', '40mg'] },
  { name: 'لانسوبرازول', nameEn: 'Lansoprazole', dosages: ['15mg', '30mg'] },
  { name: 'فاموتيدين', nameEn: 'Famotidine', dosages: ['20mg', '40mg'] },
  { name: 'رانيتيدين', nameEn: 'Ranitidine', dosages: ['150mg', '300mg'] },

  // Gastrointestinal - Antiemetics
  { name: 'ميتوكلوبراميد', nameEn: 'Metoclopramide', dosages: ['10mg'] },
  { name: 'دومبيريدون', nameEn: 'Domperidone', dosages: ['10mg'] },
  { name: 'أوندانسيترون', nameEn: 'Ondansetron', dosages: ['4mg', '8mg'] },

  // Gastrointestinal - Laxatives
  { name: 'سينا', nameEn: 'Senna', dosages: ['7.5mg'] },
  { name: 'بيساكوديل', nameEn: 'Bisacodyl', dosages: ['5mg', '10mg'] },
  { name: 'لاكتيلوز', nameEn: 'Lactulose', dosages: ['10g/15ml'] },
  { name: 'جلسرين', nameEn: 'Glycerin', dosages: ['لبوس'] },

  // Gastrointestinal - Antidiarrheal
  { name: 'لوبيراميد', nameEn: 'Loperamide', dosages: ['2mg'] },

  // Gastrointestinal - Antispasmodic
  { name: 'ميبفيرين', nameEn: 'Mebeverine', dosages: ['100mg', '200mg'] },
  { name: 'هيوسين', nameEn: 'Hyoscine', dosages: ['10mg'] },

  // Gastrointestinal - IBD
  { name: 'سلفاسالازين', nameEn: 'Sulfasalazine', dosages: ['500mg'] },
  { name: 'ميسالازين', nameEn: 'Mesalazine', dosages: ['500mg', '1000mg'] },

  // Diabetes
  { name: 'إنسولين عادي', nameEn: 'Regular Insulin', dosages: ['100 IU/ml'] },
  { name: 'إنسولين متوسط المفعول', nameEn: 'NPH Insulin', dosages: ['100 IU/ml'] },
  { name: 'إنسولين جلارجين', nameEn: 'Insulin Glargine', dosages: ['100 IU/ml'] },
  { name: 'إنسولين مخلوط', nameEn: 'Mixed Insulin', dosages: ['30/70', '50/50'] },
  { name: 'ميتفورمين', nameEn: 'Metformin', dosages: ['500mg', '850mg', '1000mg'] },
  { name: 'جليبنكلاميد', nameEn: 'Glibenclamide', dosages: ['5mg'] },
  { name: 'جليميبيريد', nameEn: 'Glimepiride', dosages: ['1mg', '2mg', '3mg', '4mg'] },
  { name: 'جليكلازيد', nameEn: 'Gliclazide', dosages: ['30mg', '60mg', '80mg'] },
  { name: 'إمباجليفلوزين', nameEn: 'Empagliflozin', dosages: ['10mg', '25mg'] },
  { name: 'داباجليفلوزين', nameEn: 'Dapagliflozin', dosages: ['5mg', '10mg'] },
  { name: 'سيتاجليبتين', nameEn: 'Sitagliptin', dosages: ['25mg', '50mg', '100mg'] },
  { name: 'جلوكاجون', nameEn: 'Glucagon', dosages: ['1mg'] },

  // Thyroid
  { name: 'ليفوثيروكسين', nameEn: 'Levothyroxine', dosages: ['25mcg', '50mcg', '100mcg'] },
  { name: 'كاربيمازول', nameEn: 'Carbimazole', dosages: ['5mg'] },
  { name: 'بروبيل ثيوراسيل', nameEn: 'Propylthiouracil', dosages: ['50mg'] },

  // Corticosteroids
  { name: 'بريدنيزولون', nameEn: 'Prednisolone', dosages: ['5mg', '10mg', '20mg'] },
  { name: 'ديكساميثازون', nameEn: 'Dexamethasone', dosages: ['0.5mg', '4mg', '8mg'] },
  { name: 'هيدروكورتيزون', nameEn: 'Hydrocortisone', dosages: ['10mg', '100mg', '250mg'] },
  { name: 'ميثيل بريدنيزولون', nameEn: 'Methylprednisolone', dosages: ['4mg', '16mg', '500mg', '1g'] },
  { name: 'بيتاميثازون', nameEn: 'Betamethasone', dosages: ['0.5mg', '4mg'] },

  // Respiratory
  { name: 'سالبيوتامول', nameEn: 'Salbutamol', dosages: ['2mg', '4mg', '100mcg بخاخ'] },
  { name: 'بوديسونيد', nameEn: 'Budesonide', dosages: ['100mcg', '200mcg', '400mcg'] },
  { name: 'فلوتيكازون', nameEn: 'Fluticasone', dosages: ['50mcg', '125mcg', '250mcg'] },
  { name: 'سالميتيرول', nameEn: 'Salmeterol', dosages: ['25mcg'] },
  { name: 'فورموتيرول', nameEn: 'Formoterol', dosages: ['12mcg'] },
  { name: 'إبراتروبيوم', nameEn: 'Ipratropium', dosages: ['20mcg'] },
  { name: 'تيوتروبيوم', nameEn: 'Tiotropium', dosages: ['18mcg'] },
  { name: 'مونتيلوكاست', nameEn: 'Montelukast', dosages: ['4mg', '5mg', '10mg'] },
  { name: 'ثيوفيللين', nameEn: 'Theophylline', dosages: ['200mg', '300mg', '400mg'] },
  { name: 'أمينوفيللين', nameEn: 'Aminophylline', dosages: ['25mg/ml'] },

  // Cough & Mucolytics
  { name: 'ديكستروميثورفان', nameEn: 'Dextromethorphan', dosages: ['10mg', '15mg'] },
  { name: 'أمبروكسول', nameEn: 'Ambroxol', dosages: ['30mg', '75mg'] },
  { name: 'برومهيكسين', nameEn: 'Bromhexine', dosages: ['8mg'] },
  { name: 'كاربوسيستين', nameEn: 'Carbocysteine', dosages: ['375mg', '500mg'] },
  { name: 'أسيتيل سيستين', nameEn: 'Acetylcysteine', dosages: ['200mg', '600mg'] },
  { name: 'جوايفينيسين', nameEn: 'Guaifenesin', dosages: ['100mg', '200mg'] },

  // Vitamins & Minerals
  { name: 'فيتامين أ', nameEn: 'Vitamin A', dosages: ['5000 IU', '10000 IU'] },
  { name: 'فيتامين ب المركب', nameEn: 'Vitamin B Complex', dosages: ['قرص'] },
  { name: 'فيتامين ب12', nameEn: 'Vitamin B12', dosages: ['250mcg', '1000mcg'] },
  { name: 'فيتامين سي', nameEn: 'Vitamin C', dosages: ['250mg', '500mg', '1000mg'] },
  { name: 'فيتامين د', nameEn: 'Vitamin D', dosages: ['1000 IU', '5000 IU', '50000 IU'] },
  { name: 'فيتامين هـ', nameEn: 'Vitamin E', dosages: ['400 IU'] },
  { name: 'فيتامين ك', nameEn: 'Vitamin K', dosages: ['10mg'] },
  { name: 'حمض الفوليك', nameEn: 'Folic Acid', dosages: ['1mg', '5mg'] },
  { name: 'حديد', nameEn: 'Iron', dosages: ['27mg', '65mg', '100mg'] },
  { name: 'كالسيوم', nameEn: 'Calcium', dosages: ['500mg', '600mg', '1000mg'] },
  { name: 'كالسيوم + فيتامين د', nameEn: 'Calcium + Vitamin D', dosages: ['500mg+200IU', '600mg+400IU'] },
  { name: 'زنك', nameEn: 'Zinc', dosages: ['20mg', '50mg'] },
  { name: 'ماغنسيوم', nameEn: 'Magnesium', dosages: ['250mg', '400mg'] },
  { name: 'بوتاسيوم', nameEn: 'Potassium', dosages: ['600mg'] },
  { name: 'أوميجا 3', nameEn: 'Omega 3', dosages: ['1000mg'] },

  // Ophthalmology
  { name: 'قطرة جنتاميسين', nameEn: 'Gentamicin Eye Drops', dosages: ['0.3%'] },
  { name: 'قطرة توبراميسين', nameEn: 'Tobramycin Eye Drops', dosages: ['0.3%'] },
  { name: 'قطرة سيبروفلوكساسين', nameEn: 'Ciprofloxacin Eye Drops', dosages: ['0.3%'] },
  { name: 'قطرة موكسيفلوكساسين', nameEn: 'Moxifloxacin Eye Drops', dosages: ['0.5%'] },
  { name: 'قطرة بريدنيزولون', nameEn: 'Prednisolone Eye Drops', dosages: ['1%'] },
  { name: 'قطرة ديكساميثازون', nameEn: 'Dexamethasone Eye Drops', dosages: ['0.1%'] },
  { name: 'قطرة تيمولول', nameEn: 'Timolol Eye Drops', dosages: ['0.25%', '0.5%'] },
  { name: 'قطرة لاتانوبروست', nameEn: 'Latanoprost Eye Drops', dosages: ['0.005%'] },
  { name: 'دموع صناعية', nameEn: 'Artificial Tears', dosages: ['قطرة'] },

  // ENT
  { name: 'قطرة أوتوفلوكس', nameEn: 'Ciprofloxacin Ear Drops', dosages: ['0.3%'] },
  { name: 'بخاخ زايلوميتازولين', nameEn: 'Xylometazoline Nasal Spray', dosages: ['0.05%', '0.1%'] },
  { name: 'بخاخ أوكسيميتازولين', nameEn: 'Oxymetazoline Nasal Spray', dosages: ['0.05%'] },
  { name: 'بخاخ فلوتيكازون أنفي', nameEn: 'Fluticasone Nasal Spray', dosages: ['50mcg'] },
  { name: 'بخاخ موميتازون أنفي', nameEn: 'Mometasone Nasal Spray', dosages: ['50mcg'] },

  // Dermatology
  { name: 'كريم فيوسيدين', nameEn: 'Fusidic Acid Cream', dosages: ['2%'] },
  { name: 'كريم ميوبيروسين', nameEn: 'Mupirocin Cream', dosages: ['2%'] },
  { name: 'كريم كلوتريمازول', nameEn: 'Clotrimazole Cream', dosages: ['1%'] },
  { name: 'كريم ميكونازول', nameEn: 'Miconazole Cream', dosages: ['2%'] },
  { name: 'كريم تيربينافين', nameEn: 'Terbinafine Cream', dosages: ['1%'] },
  { name: 'كريم بيتاميثازون', nameEn: 'Betamethasone Cream', dosages: ['0.05%', '0.1%'] },
  { name: 'كريم هيدروكورتيزون', nameEn: 'Hydrocortisone Cream', dosages: ['1%'] },
  { name: 'كريم موميتازون', nameEn: 'Mometasone Cream', dosages: ['0.1%'] },

  // Mental Health
  { name: 'سيرترالين', nameEn: 'Sertraline', dosages: ['25mg', '50mg', '100mg'] },
  { name: 'فلوكسيتين', nameEn: 'Fluoxetine', dosages: ['20mg', '40mg'] },
  { name: 'إسيتالوبرام', nameEn: 'Escitalopram', dosages: ['5mg', '10mg', '20mg'] },
  { name: 'باروكسيتين', nameEn: 'Paroxetine', dosages: ['20mg', '40mg'] },
  { name: 'فينلافاكسين', nameEn: 'Venlafaxine', dosages: ['37.5mg', '75mg', '150mg'] },
  { name: 'دولوكسيتين', nameEn: 'Duloxetine', dosages: ['30mg', '60mg'] },
  { name: 'ميرتازابين', nameEn: 'Mirtazapine', dosages: ['15mg', '30mg', '45mg'] },
  { name: 'أميتريبتيلين', nameEn: 'Amitriptyline', dosages: ['10mg', '25mg', '50mg'] },
  { name: 'كلوميبرامين', nameEn: 'Clomipramine', dosages: ['25mg', '75mg'] },
  { name: 'ألبرازولام', nameEn: 'Alprazolam', dosages: ['0.25mg', '0.5mg', '1mg'] },
  { name: 'لورازيبام', nameEn: 'Lorazepam', dosages: ['1mg', '2mg'] },
  { name: 'كلونازيبام', nameEn: 'Clonazepam', dosages: ['0.5mg', '2mg'] },
  { name: 'زولبيديم', nameEn: 'Zolpidem', dosages: ['5mg', '10mg'] },
  { name: 'ريسبيريدون', nameEn: 'Risperidone', dosages: ['0.5mg', '1mg', '2mg', '4mg'] },
  { name: 'أولانزابين', nameEn: 'Olanzapine', dosages: ['5mg', '10mg'] },
  { name: 'كويتيابين', nameEn: 'Quetiapine', dosages: ['25mg', '100mg', '200mg', '300mg'] },
  { name: 'أريبيبرازول', nameEn: 'Aripiprazole', dosages: ['5mg', '10mg', '15mg'] },
  { name: 'هالوبيريدول', nameEn: 'Haloperidol', dosages: ['1.5mg', '5mg'] },
  { name: 'ليثيوم', nameEn: 'Lithium', dosages: ['300mg', '400mg'] },

  // Common Egyptian Brand Names
  { name: 'بانادول', nameEn: 'Panadol', dosages: ['500mg', '1000mg'] },
  { name: 'أدول', nameEn: 'Adol', dosages: ['500mg'] },
  { name: 'بروفين', nameEn: 'Brufen', dosages: ['200mg', '400mg', '600mg'] },
  { name: 'كتافلام', nameEn: 'Cataflam', dosages: ['25mg', '50mg'] },
  { name: 'فولتارين', nameEn: 'Voltaren', dosages: ['25mg', '50mg', '75mg', '100mg'] },
  { name: 'أوجمنتين', nameEn: 'Augmentin', dosages: ['375mg', '625mg', '1g'] },
  { name: 'هايبيوتك', nameEn: 'Hibiotic', dosages: ['375mg', '625mg', '1g'] },
  { name: 'فلاجيل', nameEn: 'Flagyl', dosages: ['250mg', '500mg'] },
  { name: 'انتينال', nameEn: 'Antinal', dosages: ['200mg'] },
  { name: 'زيثروماكس', nameEn: 'Zithromax', dosages: ['250mg', '500mg'] },
  { name: 'كلاسيد', nameEn: 'Klacid', dosages: ['250mg', '500mg'] },
  { name: 'سيبروسين', nameEn: 'Ciprocin', dosages: ['250mg', '500mg'] },
  { name: 'تافانيك', nameEn: 'Tavanic', dosages: ['500mg', '750mg'] },
  { name: 'كونجستال', nameEn: 'Congestal', dosages: ['قرص'] },
  { name: 'كومتريكس', nameEn: 'Comtrex', dosages: ['قرص'] },
  { name: 'فلورست', nameEn: 'Flurest', dosages: ['قرص'] },
  { name: '123', nameEn: '123', dosages: ['قرص'] },
  { name: 'نيكسيوم', nameEn: 'Nexium', dosages: ['20mg', '40mg'] },
  { name: 'كونترولوك', nameEn: 'Controloc', dosages: ['20mg', '40mg'] },
  { name: 'لوسيك', nameEn: 'Losec', dosages: ['20mg', '40mg'] },
  { name: 'موتيليوم', nameEn: 'Motilium', dosages: ['10mg'] },
  { name: 'بريمبيران', nameEn: 'Primperan', dosages: ['10mg'] },
  { name: 'دوسباتالين', nameEn: 'Duspatalin', dosages: ['135mg', '200mg'] },
  { name: 'ليبراكس', nameEn: 'Librax', dosages: ['قرص'] },
  { name: 'جلوكوفاج', nameEn: 'Glucophage', dosages: ['500mg', '850mg', '1000mg'] },
  { name: 'أماريل', nameEn: 'Amaryl', dosages: ['1mg', '2mg', '3mg', '4mg'] },
  { name: 'دياميكرون', nameEn: 'Diamicron', dosages: ['30mg', '60mg', '80mg'] },
  { name: 'جانوفيا', nameEn: 'Januvia', dosages: ['25mg', '50mg', '100mg'] },
  { name: 'جارديانس', nameEn: 'Jardiance', dosages: ['10mg', '25mg'] },
  { name: 'إلتروكسين', nameEn: 'Eltroxin', dosages: ['25mcg', '50mcg', '100mcg'] },
  { name: 'كونكور', nameEn: 'Concor', dosages: ['2.5mg', '5mg', '10mg'] },
  { name: 'تريتاس', nameEn: 'Tritace', dosages: ['2.5mg', '5mg', '10mg'] },
  { name: 'كوزار', nameEn: 'Cozaar', dosages: ['50mg', '100mg'] },
  { name: 'ديوفان', nameEn: 'Diovan', dosages: ['80mg', '160mg', '320mg'] },
  { name: 'نورفاسك', nameEn: 'Norvasc', dosages: ['5mg', '10mg'] },
  { name: 'ليبيتور', nameEn: 'Lipitor', dosages: ['10mg', '20mg', '40mg', '80mg'] },
  { name: 'كريستور', nameEn: 'Crestor', dosages: ['5mg', '10mg', '20mg', '40mg'] },
  { name: 'أسبوسيد', nameEn: 'Aspocid', dosages: ['75mg', '100mg'] },
  { name: 'بلافيكس', nameEn: 'Plavix', dosages: ['75mg'] },
  { name: 'زيلت', nameEn: 'Xarelto', dosages: ['10mg', '15mg', '20mg'] },
  { name: 'كليكسان', nameEn: 'Clexane', dosages: ['20mg', '40mg', '60mg', '80mg'] },
  { name: 'لازكس', nameEn: 'Lasix', dosages: ['20mg', '40mg'] },
  { name: 'الداكتون', nameEn: 'Aldactone', dosages: ['25mg', '100mg'] },
  { name: 'فنتولين', nameEn: 'Ventolin', dosages: ['2mg', '4mg', '100mcg بخاخ'] },
  { name: 'سيريتايد', nameEn: 'Seretide', dosages: ['25/50', '25/125', '25/250'] },
  { name: 'سيمبيكورت', nameEn: 'Symbicort', dosages: ['80/4.5', '160/4.5', '320/9'] },
  { name: 'أيريوس', nameEn: 'Aerius', dosages: ['5mg'] },
  { name: 'تلفاست', nameEn: 'Telfast', dosages: ['120mg', '180mg'] },
  { name: 'زيرتك', nameEn: 'Zyrtec', dosages: ['10mg'] },
  { name: 'كلاريتين', nameEn: 'Claritine', dosages: ['10mg'] },
  { name: 'زولوفت', nameEn: 'Zoloft', dosages: ['50mg', '100mg'] },
  { name: 'سيبرالكس', nameEn: 'Cipralex', dosages: ['10mg', '20mg'] },
  { name: 'زاناكس', nameEn: 'Xanax', dosages: ['0.25mg', '0.5mg', '1mg'] },
  { name: 'ليكسوتانيل', nameEn: 'Lexotanil', dosages: ['1.5mg', '3mg'] },
  { name: 'ستيلنوكس', nameEn: 'Stilnox', dosages: ['10mg'] },
  { name: 'ريسبردال', nameEn: 'Risperdal', dosages: ['1mg', '2mg', '4mg'] },
  { name: 'سيروكويل', nameEn: 'Seroquel', dosages: ['25mg', '100mg', '200mg'] },
  { name: 'أبيليفاي', nameEn: 'Abilify', dosages: ['5mg', '10mg', '15mg'] },
  { name: 'تجريتول', nameEn: 'Tegretol', dosages: ['200mg', '400mg'] },
  { name: 'ديباكين', nameEn: 'Depakine', dosages: ['200mg', '500mg'] },
  { name: 'كيبرا', nameEn: 'Keppra', dosages: ['250mg', '500mg', '1000mg'] },
  { name: 'ليريكا', nameEn: 'Lyrica', dosages: ['50mg', '75mg', '150mg', '300mg'] },
  { name: 'نيوروتين', nameEn: 'Neurontin', dosages: ['100mg', '300mg', '400mg'] },
];
export const frequencies = [
  { ar: 'مرة يومياً', en: 'Once daily' },
  { ar: 'مرتين يومياً', en: 'Twice daily' },
  { ar: 'ثلاث مرات يومياً', en: 'Three times daily' },
  { ar: 'أربع مرات يومياً', en: 'Four times daily' },
  { ar: 'كل 4 ساعات', en: 'Every 4 hours' },
  { ar: 'كل 6 ساعات', en: 'Every 6 hours' },
  { ar: 'كل 8 ساعات', en: 'Every 8 hours' },
  { ar: 'كل 12 ساعة', en: 'Every 12 hours' },
  { ar: 'عند اللزوم', en: 'As needed' },
  { ar: 'قبل النوم', en: 'Before bedtime' },
];

export const durations = [
  { ar: '3 أيام', en: '3 days' },
  { ar: '5 أيام', en: '5 days' },
  { ar: '7 أيام', en: '7 days' },
  { ar: '10 أيام', en: '10 days' },
  { ar: '14 يوم', en: '14 days' },
  { ar: 'أسبوع', en: '1 week' },
  { ar: 'أسبوعين', en: '2 weeks' },
  { ar: 'شهر', en: '1 month' },
  { ar: 'حتى نفاد الكمية', en: 'Until finished' },
  { ar: 'حتى الزيارة القادمة', en: 'Until next visit' },
];

export const instructions = [
  { ar: 'قبل الأكل', en: 'Before meal' },
  { ar: 'بعد الأكل', en: 'After meal' },
  { ar: 'مع الأكل', en: 'With meal' },
  { ar: 'على معدة فارغة', en: 'On empty stomach' },
  { ar: 'مع كمية كافية من الماء', en: 'With plenty of water' },
  { ar: 'قبل النوم', en: 'Before bedtime' },
  { ar: 'صباحاً', en: 'In the morning' },
  { ar: 'مساءً', en: 'In the evening' },
];

export const specialties = [
  { ar: 'طب عام', en: 'General Medicine' },
  { ar: 'طب أطفال', en: 'Pediatrics' },
  { ar: 'طب باطني', en: 'Internal Medicine' },
  { ar: 'جراحة عامة', en: 'General Surgery' },
  { ar: 'طب نساء وتوليد', en: 'Obstetrics & Gynecology' },
  { ar: 'طب عظام', en: 'Orthopedics' },
  { ar: 'طب قلب', en: 'Cardiology' },
  { ar: 'طب أعصاب', en: 'Neurology' },
  { ar: 'طب جلدية', en: 'Dermatology' },
  { ar: 'طب عيون', en: 'Ophthalmology' },
  { ar: 'طب أنف وأذن وحنجرة', en: 'ENT' },
  { ar: 'طب أسنان', en: 'Dentistry' },
  { ar: 'طب نفسي', en: 'Psychiatry' },
  { ar: 'طب تجميل', en: 'Plastic Surgery' },
];
