export type QueueStatus = 'waiting' | 'in-progress' | 'done';

/**
 * Visit type, picked when the patient joins the queue:
 *   examination      كشف
 *   half_examination نص كشف
 *   consultation     استشارة
 *   free             كشف مجاني
 */
export type QueueVisitType = 'examination' | 'half_examination' | 'consultation' | 'free';

export const QUEUE_VISIT_TYPES: QueueVisitType[] = [
  'examination',
  'half_examination',
  'consultation',
  'free',
];

export interface QueueEntry {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  position: number;
  status: QueueStatus;
  visitType: QueueVisitType;
  addedAt: Date;
  addedBy: string;
  queueDate: string; // YYYY-MM-DD
}

export interface CreateQueueEntryInput {
  doctorId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  addedBy: string;
  visitType?: QueueVisitType;
}

export interface UpdateQueueEntryInput {
  status?: QueueStatus;
  position?: number;
  visitType?: QueueVisitType;
}

/** Price for one queue entry, from the doctor's settings. كشف مجاني is free. */
export function priceForVisitType(
  visitType: QueueVisitType,
  prices: { newVisitPrice: number; followupVisitPrice: number; consultationPrice: number }
): number {
  switch (visitType) {
    case 'examination':      return prices.newVisitPrice;
    case 'half_examination': return prices.followupVisitPrice;
    case 'consultation':     return prices.consultationPrice;
    case 'free':             return 0;
    default:                 return 0;
  }
}
