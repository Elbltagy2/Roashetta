export interface VisitAttachment {
  id: string;
  visitId: string;
  name: string;
  type: string;
  dataUrl: string;
  uploadedBy: string;
  uploaderType: 'doctor' | 'assistant';
  createdAt: Date;
}

export type CreateVisitAttachmentInput = Omit<VisitAttachment, 'id' | 'createdAt'>;
