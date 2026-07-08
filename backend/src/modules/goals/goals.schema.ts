import { z } from 'zod';

export const createGoalSchema = z.object({
  accountId: z.string().optional(), // Phase 1: optional accountId fallback to default
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  targetRR: z.number().min(0.5, 'Minimum RR target is 0.5'),
  targetWinRate: z.number().min(0).max(100),
  maxDailyTrades: z.number().int().min(1),
  maxDailyLoss: z.number().positive(),
  targetConsistency: z.number().min(0).max(100),
  targetNetRR: z.number().optional(),
  targetTrades: z.number().int().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export const updateGoalSchema = createGoalSchema.partial().omit({ month: true });

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
