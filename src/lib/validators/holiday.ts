import { z } from 'zod';

export const createHolidaySchema = z.object({
  name: z.string().min(2, 'Holiday name is required'),
  date: z.string().min(1, 'Date is required').or(z.date()),
  isOptional: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
