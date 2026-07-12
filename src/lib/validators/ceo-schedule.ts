import { z } from 'zod';

export const createCeoScheduleSchema = z.object({
  eventType: z.enum([
    'Vacation',
    'Business Trip',
    'Conference',
    'Client Meeting',
    'Work From Home',
    'Medical Leave',
    'Personal Time',
    'Other'
  ]),
  title: z.string().min(2, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().max(500).optional().nullable(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export type CreateCeoScheduleInput = z.infer<typeof createCeoScheduleSchema>;
