import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, UserCheck, UserX, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api, { Assistant, CreateAssistantData, AssistantPermissions } from '@/services/api';

const AssistantsPage: React.FC = () => {
  const { language } = useLanguage();
  const { isDoctor } = useAuth();
  const { toast } = useToast();

  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    permissions: {
      canCreatePatients: true,
      canEditPatients: true,
      canDeletePatients: false,
      canCreateVisits: true,
      canEditVisits: true,
      canDeleteVisits: false,
      canViewPrescriptions: false,
      canCreatePrescriptions: false,
      canManageRecords: true,
    } as AssistantPermissions,
  });

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      const data = await api.getAssistants();
      setAssistants(data);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في تحميل المساعدين' : 'Failed to load assistants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      permissions: {
        canCreatePatients: true,
        canEditPatients: true,
        canDeletePatients: false,
        canCreateVisits: true,
        canEditVisits: true,
        canDeleteVisits: false,
        canViewPrescriptions: false,
        canCreatePrescriptions: false,
        canManageRecords: true,
      },
    });
    setEditingAssistant(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAssistant) {
        // Update assistant
        const updated = await api.updateAssistant(editingAssistant.id, {
          name: formData.name,
          phone: formData.phone,
          permissions: formData.permissions,
        });
        setAssistants(prev => prev.map(a => a.id === updated.id ? updated : a));
        toast({
          title: language === 'ar' ? 'تم تحديث المساعد' : 'Assistant updated',
        });
      } else {
        // Create assistant
        const newAssistant = await api.createAssistant({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          permissions: formData.permissions,
        });
        setAssistants(prev => [newAssistant, ...prev]);
        toast({
          title: language === 'ar' ? 'تم إضافة المساعد' : 'Assistant added',
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      name: assistant.name,
      email: assistant.email,
      password: '',
      phone: assistant.phone,
      permissions: assistant.permissions,
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (assistant: Assistant) => {
    try {
      const updated = await api.updateAssistant(assistant.id, {
        isActive: !assistant.isActive,
      });
      setAssistants(prev => prev.map(a => a.id === updated.id ? updated : a));
      toast({
        title: assistant.isActive
          ? (language === 'ar' ? 'تم تعطيل الحساب' : 'Account deactivated')
          : (language === 'ar' ? 'تم تفعيل الحساب' : 'Account activated'),
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المساعد؟' : 'Are you sure you want to delete this assistant?')) {
      return;
    }

    try {
      await api.deleteAssistant(id);
      setAssistants(prev => prev.filter(a => a.id !== id));
      toast({
        title: language === 'ar' ? 'تم حذف المساعد' : 'Assistant deleted',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const permissionLabels: Record<keyof AssistantPermissions, { ar: string; en: string }> = {
    canCreatePatients: { ar: 'إضافة مرضى', en: 'Create Patients' },
    canEditPatients: { ar: 'تعديل مرضى', en: 'Edit Patients' },
    canDeletePatients: { ar: 'حذف مرضى', en: 'Delete Patients' },
    canCreateVisits: { ar: 'إضافة زيارات', en: 'Create Visits' },
    canEditVisits: { ar: 'تعديل زيارات', en: 'Edit Visits' },
    canDeleteVisits: { ar: 'حذف زيارات', en: 'Delete Visits' },
    canViewPrescriptions: { ar: 'عرض الوصفات', en: 'View Prescriptions' },
    canCreatePrescriptions: { ar: 'إنشاء وصفات', en: 'Create Prescriptions' },
    canManageRecords: { ar: 'إدارة السجلات', en: 'Manage Records' },
  };

  if (!isDoctor) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">
            {language === 'ar' ? 'هذه الصفحة للأطباء فقط' : 'This page is for doctors only'}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'المساعدون' : 'Assistants'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'إدارة حسابات المساعدين' : 'Manage assistant accounts'}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'إضافة مساعد' : 'Add Assistant'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAssistant
                    ? (language === 'ar' ? 'تعديل المساعد' : 'Edit Assistant')
                    : (language === 'ar' ? 'إضافة مساعد جديد' : 'Add New Assistant')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {!editingAssistant && (
                  <>
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {language === 'ar' ? 'الصلاحيات' : 'Permissions'}
                  </Label>
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    {(Object.keys(permissionLabels) as Array<keyof AssistantPermissions>).map((key) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">
                          {language === 'ar' ? permissionLabels[key].ar : permissionLabels[key].en}
                        </span>
                        <Switch
                          checked={formData.permissions[key]}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, [key]: checked },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {editingAssistant
                    ? (language === 'ar' ? 'تحديث' : 'Update')
                    : (language === 'ar' ? 'إضافة' : 'Add')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assistants List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : assistants.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لا يوجد مساعدون بعد' : 'No assistants yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assistants.map((assistant) => (
              <motion.div
                key={assistant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-4 card-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      assistant.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {assistant.isActive ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{assistant.name}</h3>
                      <p className="text-sm text-muted-foreground">{assistant.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(assistant)}
                    >
                      {assistant.isActive
                        ? (language === 'ar' ? 'تعطيل' : 'Deactivate')
                        : (language === 'ar' ? 'تفعيل' : 'Activate')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(assistant)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(assistant.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Permissions badges */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(Object.keys(assistant.permissions) as Array<keyof AssistantPermissions>)
                    .filter(key => assistant.permissions[key])
                    .map(key => (
                      <span
                        key={key}
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                      >
                        {language === 'ar' ? permissionLabels[key].ar : permissionLabels[key].en}
                      </span>
                    ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssistantsPage;
