export type AccountType = 'propFirmChallenge' | 'fundedAccount' | 'personal' | 'demo';
export type AccountStatus = 'active' | 'passed' | 'failed' | 'funded' | 'archived';

export interface PropFirmRules {
  profitTarget?: number;      // %
  maxDailyLoss?: number;      // %
  maxOverallLoss?: number;    // %
  minTradingDays?: number;
  maxTradingDays?: number;
  challengeStartDate?: string;
  challengeEndDate?: string;
}

export interface PersonalGoals {
  monthlyTarget?: number;     // $ amount
  maxDailyLoss?: number;      // %
  maxDrawdown?: number;       // %
}

export interface Account {
  _id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  broker?: string;
  currency: string;
  startingBalance: number;
  isDefault: boolean;
  status: AccountStatus;
  propFirmRules?: PropFirmRules;
  personalGoals?: PersonalGoals;
  currentBalance?: number; // Phase 2: auto-derived balance
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  name: string;
  accountType: AccountType;
  broker?: string;
  currency: string;
  startingBalance: number;
  propFirmRules?: PropFirmRules;
  personalGoals?: PersonalGoals;
}
