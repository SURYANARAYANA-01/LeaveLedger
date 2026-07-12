import { z } from 'zod';

export const applyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'Please select a leave type'),
  startDate: z.string().min(1, 'Start date is required').or(z.date()),
  endDate: z.string().min(1, 'End date is required').or(z.date()),
  dayType: z.enum(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF']).optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;

export const approveLeaveSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(500).optional(),
});

export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;
