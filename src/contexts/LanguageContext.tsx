import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.patients': 'المرضى',
    'nav.appointments': 'المواعيد',
    'nav.prescriptions': 'الوصفات الطبية',
    'nav.expenses': 'المصروفات',
    'nav.assistants': 'المساعدون',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.hasAccount': 'لديك حساب بالفعل؟',
    'auth.welcomeBack': 'مرحباً بعودتك',
    'auth.createAccount': 'إنشاء حساب جديد',
    'auth.loginSubtitle': 'سجل دخولك للوصول إلى لوحة التحكم',
    'auth.signupSubtitle': 'ابدأ في إدارة عيادتك بكفاءة',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً',
    'dashboard.todayAppointments': 'مواعيد اليوم',
    'dashboard.totalPatients': 'إجمالي المرضى',
    'dashboard.thisMonth': 'هذا الشهر',
    'dashboard.prescriptions': 'الوصفات الطبية',
    'dashboard.recentPatients': 'آخر المرضى',
    'dashboard.quickActions': 'إجراءات سريعة',
    
    // Patients
    'patients.title': 'المرضى',
    'patients.addNew': 'إضافة مريض جديد',
    'patients.search': 'بحث عن مريض...',
    'patients.name': 'اسم المريض',
    'patients.phone': 'رقم الهاتف',
    'patients.age': 'العمر',
    'patients.gender': 'الجنس',
    'patients.male': 'ذكر',
    'patients.female': 'أنثى',
    'patients.nationalId': 'الرقم القومي',
    'patients.medicalHistory': 'التاريخ المرضي',
    'patients.allergies': 'الحساسية',
    'patients.noAllergies': 'لا توجد حساسية',
    'patients.previousVisits': 'الزيارات السابقة',
    'patients.noPatients': 'لا يوجد مرضى',
    'patients.years': 'سنة',
    
    // Visits
    'visits.title': 'الزيارات',
    'visits.newVisit': 'زيارة جديدة',
    'visits.date': 'التاريخ',
    'visits.chiefComplaint': 'الشكوى الرئيسية',
    'visits.diagnosis': 'التشخيص',
    'visits.notes': 'ملاحظات',
    'visits.vitals': 'العلامات الحيوية',
    'visits.bloodPressure': 'ضغط الدم',
    'visits.temperature': 'درجة الحرارة',
    'visits.weight': 'الوزن',
    'visits.addPrescription': 'إضافة وصفة طبية',
    
    // Prescriptions
    'prescriptions.title': 'الوصفة الطبية',
    'prescriptions.medicine': 'الدواء',
    'prescriptions.dosage': 'الجرعة',
    'prescriptions.frequency': 'التكرار',
    'prescriptions.duration': 'المدة',
    'prescriptions.instructions': 'التعليمات',
    'prescriptions.addMedicine': 'إضافة دواء',
    'prescriptions.print': 'طباعة الوصفة',
    'prescriptions.save': 'حفظ الوصفة',
    'prescriptions.beforeMeal': 'قبل الأكل',
    'prescriptions.afterMeal': 'بعد الأكل',
    'prescriptions.withMeal': 'مع الأكل',
    'prescriptions.onceDaily': 'مرة يومياً',
    'prescriptions.twiceDaily': 'مرتين يومياً',
    'prescriptions.thriceDaily': 'ثلاث مرات يومياً',
    'prescriptions.days': 'أيام',
    'prescriptions.weeks': 'أسابيع',
    
    // Doctor Profile
    'doctor.name': 'اسم الطبيب',
    'doctor.specialty': 'التخصص',
    'doctor.clinicName': 'اسم العيادة',
    'doctor.phone': 'رقم الهاتف',
    'doctor.licenseNumber': 'رقم الترخيص',
    
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.all': 'الكل',
    'common.today': 'اليوم',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    'common.view': 'عرض',
    'common.kg': 'كجم',
    'common.celsius': 'درجة مئوية',
    'common.mmHg': 'مم زئبق',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.patients': 'Patients',
    'nav.appointments': 'Appointments',
    'nav.prescriptions': 'Prescriptions',
    'nav.expenses': 'Expenses',
    'nav.assistants': 'Assistants',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.welcomeBack': 'Welcome Back',
    'auth.createAccount': 'Create Account',
    'auth.loginSubtitle': 'Sign in to access your dashboard',
    'auth.signupSubtitle': 'Start managing your clinic efficiently',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.todayAppointments': "Today's Appointments",
    'dashboard.totalPatients': 'Total Patients',
    'dashboard.thisMonth': 'This Month',
    'dashboard.prescriptions': 'Prescriptions',
    'dashboard.recentPatients': 'Recent Patients',
    'dashboard.quickActions': 'Quick Actions',
    
    // Patients
    'patients.title': 'Patients',
    'patients.addNew': 'Add New Patient',
    'patients.search': 'Search patients...',
    'patients.name': 'Patient Name',
    'patients.phone': 'Phone Number',
    'patients.age': 'Age',
    'patients.gender': 'Gender',
    'patients.male': 'Male',
    'patients.female': 'Female',
    'patients.nationalId': 'National ID',
    'patients.medicalHistory': 'Medical History',
    'patients.allergies': 'Allergies',
    'patients.noAllergies': 'No known allergies',
    'patients.previousVisits': 'Previous Visits',
    'patients.noPatients': 'No patients found',
    'patients.years': 'years',
    
    // Visits
    'visits.title': 'Visits',
    'visits.newVisit': 'New Visit',
    'visits.date': 'Date',
    'visits.chiefComplaint': 'Chief Complaint',
    'visits.diagnosis': 'Diagnosis',
    'visits.notes': 'Notes',
    'visits.vitals': 'Vitals',
    'visits.bloodPressure': 'Blood Pressure',
    'visits.temperature': 'Temperature',
    'visits.weight': 'Weight',
    'visits.addPrescription': 'Add Prescription',
    
    // Prescriptions
    'prescriptions.title': 'Prescription',
    'prescriptions.medicine': 'Medicine',
    'prescriptions.dosage': 'Dosage',
    'prescriptions.frequency': 'Frequency',
    'prescriptions.duration': 'Duration',
    'prescriptions.instructions': 'Instructions',
    'prescriptions.addMedicine': 'Add Medicine',
    'prescriptions.print': 'Print Prescription',
    'prescriptions.save': 'Save Prescription',
    'prescriptions.beforeMeal': 'Before meal',
    'prescriptions.afterMeal': 'After meal',
    'prescriptions.withMeal': 'With meal',
    'prescriptions.onceDaily': 'Once daily',
    'prescriptions.twiceDaily': 'Twice daily',
    'prescriptions.thriceDaily': 'Three times daily',
    'prescriptions.days': 'days',
    'prescriptions.weeks': 'weeks',
    
    // Doctor Profile
    'doctor.name': 'Doctor Name',
    'doctor.specialty': 'Specialty',
    'doctor.clinicName': 'Clinic Name',
    'doctor.phone': 'Phone Number',
    'doctor.licenseNumber': 'License Number',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.today': 'Today',
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.view': 'View',
    'common.kg': 'kg',
    'common.celsius': '°C',
    'common.mmHg': 'mmHg',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
