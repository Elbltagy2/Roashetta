import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ArrowRight, ArrowLeft, Calendar, Printer, ClipboardList, Stethoscope, FileText, Activity, Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import html2pdf from 'html2pdf.js';

const VisitDetailPage: React.FC = () => {
  const { id: patientId, visitId } = useParams<{ id: string; visitId: string }>();
  const { t, language, direction } = useLanguage();
  const { getPatient, visits, loadPatientVisits } = useData();
  const navigate = useNavigate();
  const prescriptionRef = useRef<HTMLDivElement>(null);

  const patient = getPatient(patientId || '');
  const visit = visits.find((v) => v.id === visitId);
  const BackIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;
  const dateLocale = language === 'ar' ? ar : enUS;

  // Load visits from API if not already loaded
  useEffect(() => {
    if (patientId && !visit) {
      loadPatientVisits(patientId);
    }
  }, [patientId, visit, loadPatientVisits]);

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${direction}">
      <head>
        <title>${language === 'ar' ? 'تقرير طبي' : 'Medical Report'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            background: white;
            padding: 20px;
            direction: ${direction};
          }
          .report-container {
            max-width: 800px;
            margin: 0 auto;
          }
          .report-header {
            text-align: center;
            border-bottom: 2px solid #1f2937;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .doctor-info {
            font-size: 14px;
            color: #4b5563;
          }
          .patient-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .patient-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #374151;
          }
          .patient-info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          .info-item label {
            font-size: 12px;
            color: #6b7280;
            display: block;
          }
          .info-item value {
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
          }
          .vitals-section {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .vitals-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #166534;
          }
          .vitals-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          .drawing-section {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .drawing-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .drawing-section img {
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
          .report-footer {
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
            margin-top: 30px;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <div class="report-title">${language === 'ar' ? 'تقرير طبي' : 'Medical Report'}</div>
            <div class="doctor-info">
              <div>Dr/ Sherif Ali . MD, MRCP (UK)</div>
              <div>${language === 'ar' ? 'استشارى أمراض الباطنة العامة والكلى' : 'Internal Medicine & Nephrology Consultant'}</div>
            </div>
          </div>

          <div class="patient-section">
            <h3>${language === 'ar' ? 'بيانات المريض' : 'Patient Information'}</h3>
            <div class="patient-info-grid">
              <div class="info-item">
                <label>${language === 'ar' ? 'الاسم' : 'Name'}</label>
                <value>${patient.name}</value>
              </div>
              <div class="info-item">
                <label>${language === 'ar' ? 'التاريخ' : 'Date'}</label>
                <value>${format(visit.date, 'dd/MM/yyyy')}</value>
              </div>
              <div class="info-item">
                <label>${language === 'ar' ? 'العمر' : 'Age'}</label>
                <value>${patient.age} ${language === 'ar' ? 'سنة' : 'years'}</value>
              </div>
            </div>
          </div>

          <div class="vitals-section">
            <h3>${language === 'ar' ? 'العلامات الحيوية' : 'Vitals'}</h3>
            <div class="vitals-grid">
              <div class="info-item">
                <label>${language === 'ar' ? 'ضغط الدم' : 'Blood Pressure'}</label>
                <value>${visit.vitals.bloodPressure || '-'} mmHg</value>
              </div>
              <div class="info-item">
                <label>${language === 'ar' ? 'الحرارة' : 'Temperature'}</label>
                <value>${visit.vitals.temperature || '-'}°C</value>
              </div>
              <div class="info-item">
                <label>${language === 'ar' ? 'الوزن' : 'Weight'}</label>
                <value>${visit.vitals.weight || '-'} kg</value>
              </div>
            </div>
          </div>

          ${visit.chiefComplaintDrawing ? `
          <div class="drawing-section">
            <h3>📋 ${language === 'ar' ? 'الشكوى الرئيسية' : 'Chief Complaint'}</h3>
            <img src="${visit.chiefComplaintDrawing}" alt="Chief Complaint" />
          </div>
          ` : ''}

          ${visit.diagnosisDrawing ? `
          <div class="drawing-section">
            <h3>🩺 ${language === 'ar' ? 'التشخيص' : 'Diagnosis'}</h3>
            <img src="${visit.diagnosisDrawing}" alt="Diagnosis" />
          </div>
          ` : ''}

          <div class="report-footer">
            <div>${language === 'ar' ? 'مستشفى تبارك/النسائم' : 'Tabarak/Al-Naseem Hospital'}</div>
            <div>Tel: 01554343147 - 0222602733</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadPrescriptionPDF = () => {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background: white; width: 148mm; min-height: 210mm; display: flex; flex-direction: column;">
        <div style="border-bottom: 1px solid #d1d5db; padding: 16px; padding-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="text-align: left;">
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
            </div>
            <div style="text-align: right; direction: rtl; line-height: 1.6;">
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">دكتـــور</p>
              <p style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0;">شــريف علي رضــا</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">لطب الباطنـــة والكـــلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">دكتوراه الأمـــراض الباطنيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">استشارى أمراض الباطنـــة العامة والكلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">وعضو الجمعية المصرية والأوربيـــة</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">لأمـــراض الكـــلى</p>
              <p style="font-size: 10px; color: #4b5563; margin: 0;">بمستشفيات جـــامعـــة عين شمـــس</p>
            </div>
          </div>
          <div style="margin-top: 16px; padding-top: 12px; font-size: 12px; color: #374151; text-align: left; line-height: 1.6;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>الإســـم :</span>
              <span style="font-weight: 500;">${patient.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>التـــاريخ :</span>
              <span style="font-weight: 500;">${format(visit.date, 'dd/MM/yyyy')}</span>
            </div>
          </div>
        </div>
        <div style="position: relative; flex: 1; padding: 16px; padding-left: 70px;">
          <div style="position: absolute; top: 20px; left: 20px; font-size: 40px; color: #9ca3af; font-family: 'Times New Roman', serif;">℞/</div>
          <img src="${visit.notesDrawing}" style="width: 100%; margin-top: 10px;" />
        </div>
        <div style="border-top: 1px solid #d1d5db; padding: 12px; background: #f9fafb; margin-top: auto;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 10px; color: #4b5563;">
            <div style="text-align: left;">
              <p style="font-weight: 600; margin: 0;">مستشفى تبارك/النسائم</p>
              <p style="margin: 0;">16552 - 15452</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0;">١٨ عمارات خلف العبور - مصر الجديدة</p>
              <p style="margin: 0;">ت: 01554343147 - 0222602733</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `prescription-${patient.name}-${format(visit.date, 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a5' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(container).save();
  };

  const handlePrintPrescription = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${direction}">
      <head>
        <title>${language === 'ar' ? 'طباعة الروشتة' : 'Print Prescription'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A5;
            margin: 5mm;
          }
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
          }
          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            background: white;
          }
          .prescription-wrapper {
            display: table;
            width: 100%;
            height: 100vh;
          }
          .prescription-container {
            display: table-row-group;
            background: white;
            border: none;
          }
          .prescription-footer-wrapper {
            display: table-footer-group;
          }
          .prescription-header {
            border-bottom: 1px solid #d1d5db;
            padding: 16px;
            padding-bottom: 12px;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header-left {
            text-align: left;
          }
          .header-right {
            text-align: right;
            direction: rtl;
            line-height: 1.6;
          }
          .doctor-name {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
          }
          .credentials {
            font-size: 11px;
            color: #4b5563;
          }
          .patient-info {
            margin-top: 16px;
            padding-top: 12px;
            font-size: 14px;
            color: #374151;
            text-align: left;
            line-height: 1.6;
          }
          .patient-info > div {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .prescription-body {
            position: relative;
            padding: 16px;
            padding-left: 80px;
          }
          .rx-symbol {
            position: absolute;
            top: 24px;
            left: 24px;
            font-size: 48px;
            color: #9ca3af;
            font-family: 'Times New Roman', serif;
          }
          .prescription-body img {
            width: 100%;
            height: auto;
          }
          .prescription-footer {
            border-top: 1px solid #d1d5db;
            padding: 12px;
            background: #f9fafb;
            font-size: 11px;
            color: #4b5563;
          }
          .prescription-footer > div {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .prescription-footer .text-start {
            text-align: left;
          }
          .prescription-footer .text-end {
            text-align: right;
          }
          .font-semibold {
            font-weight: 600;
          }
          .font-medium {
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="prescription-wrapper">
          <div class="prescription-container">
            <div class="prescription-header">
              <div class="header-content">
                <div class="header-left">
                  <p class="doctor-name">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
                </div>
                <div class="header-right" dir="rtl">
                  <p class="doctor-name">دكتـــور</p>
                  <p class="doctor-name">شــريف علي رضــا</p>
                  <p class="credentials">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
                  <p class="credentials">لطب الباطنـــة والكـــلى</p>
                  <p class="credentials">دكتوراه الأمـــراض الباطنيـــة</p>
                  <p class="credentials">استشارى أمراض الباطنـــة العامة والكلى</p>
                  <p class="credentials">وعضو الجمعية المصرية والأوربيـــة</p>
                  <p class="credentials">لأمـــراض الكـــلى</p>
                  <p class="credentials">بمستشفيات جـــامعـــة عين شمـــس</p>
                </div>
              </div>
              <div class="patient-info">
                <div>
                  <span>الإســـم :</span>
                  <span class="font-medium">${patient.name}</span>
                </div>
                <div>
                  <span>التـــاريخ :</span>
                  <span class="font-medium" dir="ltr">${format(visit.date, 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
            <div class="prescription-body">
              <div class="rx-symbol">℞/</div>
              <div style="padding: 16px; padding-left: 80px;">
                <img src="${visit.notesDrawing}" alt="Prescription" style="width: 100%;" />
              </div>
            </div>
          </div>
          <div class="prescription-footer-wrapper">
            <div class="prescription-footer">
              <div>
                <div class="text-start">
                  <p class="font-semibold">مستشفى تبارك/النسائم</p>
                  <p>16552 - 15452</p>
                </div>
                <div class="text-end">
                  <p>١٨ عمارات خلف العبور - مصر الجديدة</p>
                  <p>ت: 01554343147 - 0222602733</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!patient || !visit) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button onClick={() => navigate('/patients')} className="mt-4">{t('common.back')}</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="print:hidden">
          <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}`)} className="gap-2 mb-4">
            <BackIcon className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{patient.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {format(visit.date, 'PPP', { locale: dateLocale })}
              </p>
            </div>
            <div className="flex gap-2">
              {(visit.chiefComplaintDrawing || visit.diagnosisDrawing) && (
                <Button variant="outline" onClick={handlePrintReport} className="gap-2">
                  <FileText className="w-4 h-4" />
                  {language === 'ar' ? 'طباعة التقرير' : 'Print Report'}
                </Button>
              )}
              {visit.notesDrawing && (
                <>
                  <Button variant="outline" onClick={handleDownloadPrescriptionPDF} className="gap-2">
                    <Download className="w-4 h-4" />
                    {language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                  </Button>
                  <Button variant="outline" onClick={handlePrintPrescription} className="gap-2">
                    <Printer className="w-4 h-4" />
                    {language === 'ar' ? 'طباعة الروشتة' : 'Print Prescription'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>


        {/* Vitals */}
        <div className="bg-card rounded-2xl card-shadow p-6 print:shadow-none print:border print:border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary print:text-gray-600" />
            {t('visits.vitals')}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.bloodPressure')}</p>
              <p className="font-semibold">{visit.vitals.bloodPressure || '-'} mmHg</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.temperature')}</p>
              <p className="font-semibold">{visit.vitals.temperature || '-'}°C</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('visits.weight')}</p>
              <p className="font-semibold">{visit.vitals.weight || '-'} kg</p>
            </div>
          </div>
        </div>

        {/* Chief Complaint Drawing */}
        {visit.chiefComplaintDrawing && (
          <div className="bg-card rounded-2xl card-shadow p-6 print:shadow-none print:border print:border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-primary print:text-gray-600" />
              {t('visits.chiefComplaint')}
            </h2>
            <div className="bg-white rounded-xl border-2 border-gray-200 p-3 print:border-gray-300">
              <img
                src={visit.chiefComplaintDrawing}
                alt={language === 'ar' ? 'الشكوى الرئيسية' : 'Chief Complaint'}
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Diagnosis Drawing */}
        {visit.diagnosisDrawing && (
          <div className="bg-card rounded-2xl card-shadow p-6 print:shadow-none print:border print:border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-primary print:text-gray-600" />
              {t('visits.diagnosis')}
            </h2>
            <div className="bg-white rounded-xl border-2 border-gray-200 p-3 print:border-gray-300">
              <img
                src={visit.diagnosisDrawing}
                alt={language === 'ar' ? 'التشخيص' : 'Diagnosis'}
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Notes / Prescription Drawing - Egyptian Style */}
        {visit.notesDrawing && (
          <div className="bg-card rounded-2xl card-shadow p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'الروشتة' : 'Prescription'}
            </h2>

            {/* Prescription Pad - Egyptian Style (Printable) */}
            <div ref={prescriptionRef}>
              <div className="prescription-container bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col" style={{ minHeight: '700px' }}>
                {/* Header */}
                <div className="prescription-header border-b border-gray-300 p-4 pb-3 flex-shrink-0">
                  <div className="header-content flex justify-between items-start">
                    {/* Left side - English */}
                    <div className="header-left text-start">
                      <p className="doctor-name text-base font-bold text-gray-800">Dr/ Sherif Ali . MD,MRCP (Uk)</p>
                    </div>
                    {/* Right side - Arabic */}
                    <div className="header-right text-end leading-relaxed" dir="rtl">
                      <p className="doctor-name text-base font-bold text-gray-800">دكتـــور</p>
                      <p className="doctor-name text-base font-bold text-gray-800">شــريف علي رضــا</p>
                      <p className="credentials text-xs text-gray-600">زميـــل الكلية الملكيـــة البـــريطانيـــة</p>
                      <p className="credentials text-xs text-gray-600">لطب الباطنـــة والكـــلى</p>
                      <p className="credentials text-xs text-gray-600">دكتوراه الأمـــراض الباطنيـــة</p>
                      <p className="credentials text-xs text-gray-600">استشارى أمراض الباطنـــة العامة والكلى</p>
                      <p className="credentials text-xs text-gray-600">وعضو الجمعية المصرية والأوربيـــة</p>
                      <p className="credentials text-xs text-gray-600">لأمـــراض الكـــلى</p>
                      <p className="credentials text-xs text-gray-600">بمستشفيات جـــامعـــة عين شمـــس</p>
                    </div>
                  </div>

                  {/* Patient Info - Under Dr/ Sherif Ali */}
                  <div className="patient-info mt-4 pt-3 text-start text-sm text-gray-700 leading-relaxed">
                    <div className="flex items-center gap-1">
                      <span>الإســـم :</span>
                      <span className="font-medium">{patient.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>التـــاريخ :</span>
                      <span className="font-medium" dir="ltr">{format(visit.date, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </div>

                {/* Rx Symbol and Drawing Area */}
                <div className="prescription-body relative flex-1">
                  {/* Rx Symbol */}
                  <div className="rx-symbol absolute top-6 start-6 text-gray-400 text-6xl font-serif select-none pointer-events-none" style={{ fontFamily: 'Times New Roman, serif' }}>
                    ℞/
                  </div>

                  {/* Drawing Image */}
                  <div className="p-4 ps-20">
                    <img
                      src={visit.notesDrawing}
                      alt={language === 'ar' ? 'الروشتة' : 'Prescription'}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Footer - Always at bottom */}
                <div className="prescription-footer border-t border-gray-300 p-3 bg-gray-50 flex-shrink-0 mt-auto">
                  <div className="flex justify-between items-start text-xs text-gray-600">
                    <div className="text-start">
                      <p className="font-semibold">مستشفى تبارك/النسائم</p>
                      <p>16552 - 15452</p>
                    </div>
                    <div className="text-end">
                      <p>١٨ عمارات خلف العبور - مصر الجديدة</p>
                      <p>ت: 01554343147 - 0222602733</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback for text content (if any) */}
        {(visit.chiefComplaint || visit.diagnosis || visit.notes) && (
          <div className="bg-card rounded-2xl card-shadow p-6 print:shadow-none print:border print:border-gray-200">
            <h2 className="text-lg font-semibold mb-4">{language === 'ar' ? 'ملاحظات نصية' : 'Text Notes'}</h2>
            {visit.chiefComplaint && (
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">{t('visits.chiefComplaint')}</p>
                <p className="font-semibold text-foreground">{visit.chiefComplaint}</p>
              </div>
            )}
            {visit.diagnosis && (
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">{t('visits.diagnosis')}</p>
                <p className="font-semibold text-foreground">{visit.diagnosis}</p>
              </div>
            )}
            {visit.notes && (
              <div>
                <p className="text-sm text-muted-foreground">{t('visits.notes')}</p>
                <p className="text-foreground">{visit.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VisitDetailPage;
