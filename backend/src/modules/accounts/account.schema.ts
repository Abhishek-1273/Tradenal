import { z } from 'zod';

const ACCOUNT_TYPES = ['propFirmChallenge', 'fundedAccount', 'personal', 'demo'] as const;
const ACCOUNT_STATUSES = ['active', 'passed', 'failed', 'funded', 'archived'] as const;

const propFirmRulesSchema = z.object({
  profitTarget: z.number().min(0).optional(),
  maxDailyLoss: z.number().min(0).optional(),
  maxOverallLoss: z.number().min(0).optional(),
  minTradingDays: z.number().int().min(1).optional(),
  maxTradingDays: z.number().int().min(1).optional(),
  challengeStartDate: z
    .string()
    .refine((val) => !isNaN(new Date(val).getTime()), 'Invalid date')
    .transform((val) => new Date(val))
    .optional(),
  challengeEndDate: z
    .string()
    .refine((val) => !isNaN(new Date(val).getTime()), 'Invalid date')
    .transform((val) => new Date(val))
    .optional(),
});

const personalGoalsSchema = z.object({
  monthlyTarget: z.number().min(0).optional(),
  maxDailyLoss: z.number().min(0).optional(),
  maxDrawdown: z.number().min(0).optional(),
});

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100).trim(),
  accountType: z.enum(ACCOUNT_TYPES),
  broker: z.string().max(100).trim().optional(),
  currency: z.string().min(1).max(10).toUpperCase().trim().default('USD'),
  startingBalance: z.number().min(0, 'Starting balance cannot be negative').default(0),
  propFirmRules: propFirmRulesSchema.optional(),
  personalGoals: personalGoalsSchema.optional(),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  status: z.enum(ACCOUNT_STATUSES).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
