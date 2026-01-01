export interface AssistantPermissions {
  canCreatePatients: boolean;
  canEditPatients: boolean;
  canDeletePatients: boolean;
  canCreateVisits: boolean;
  canEditVisits: boolean;
  canDeleteVisits: boolean;
  canViewPrescriptions: boolean;
  canCreatePrescriptions: boolean;
  canManageRecords: boolean;
}

export interface Assistant {
  id: string;
  doctorId: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  isActive: boolean;
  permissions: AssistantPermissions;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAssistantInput = {
  doctorId: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  permissions?: Partial<AssistantPermissions>;
};

export type UpdateAssistantInput = Partial<{
  name: string;
  phone: string;
  isActive: boolean;
  permissions: Partial<AssistantPermissions>;
}>;

export const DEFAULT_ASSISTANT_PERMISSIONS: AssistantPermissions = {
  canCreatePatients: true,
  canEditPatients: true,
  canDeletePatients: false,
  canCreateVisits: true,
  canEditVisits: true,
  canDeleteVisits: false,
  canViewPrescriptions: false,
  canCreatePrescriptions: false,
  canManageRecords: true,
};
