import { Account } from '../types';

export interface RiskCapAudit {
  accountBalance: number;
  currency: string;
  currencySymbol: string;
  maxOnePercentRisk: number;
  plannedRiskPercent: number;
  plannedRiskAmount: number;
  realizedPnL?: number;
  isViolated: boolean;
  violationReason?: string;
  statusLabel: string;
}

export const getCurrencySymbol = (currency = 'USD'): string => {
  switch (currency.toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'INR':
      return '₹';
    case 'JPY':
      return '¥';
    case 'AUD':
      return 'A$';
    case 'CAD':
      return 'C$';
    default:
      return `${currency} `;
  }
};

export const calculateRiskCapAudit = (
  account: Account | null | undefined,
  riskPercentStr?: string,
  pnlAmountStr?: string
): RiskCapAudit => {
  const accountBalance = account?.startingBalance ?? account?.currentBalance ?? 5000;
  const currency = account?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);
  const maxOnePercentRisk = accountBalance * 0.01;

  const rp = parseFloat(riskPercentStr || '0');
  const plannedRiskPercent = isNaN(rp) ? 0 : rp;
  const plannedRiskAmount = (plannedRiskPercent * accountBalance) / 100;

  const pnlNum = parseFloat(pnlAmountStr || '');
  const realizedPnL = !isNaN(pnlNum) ? pnlNum : undefined;

  // Realistic market spread & execution slippage buffer (5% tolerance or min 3 units)
  const slippageTolerance = Math.max(3, maxOnePercentRisk * 0.05);
  const maxAllowedLoss = maxOnePercentRisk + slippageTolerance;

  let isViolated = false;
  let violationReason = '';

  // Allow up to 1.05% planned risk to prevent rounding false-positives
  if (plannedRiskPercent > 1.05) {
    isViolated = true;
    violationReason = `Planned risk (${plannedRiskPercent.toFixed(1)}%) breaches the ≤ 1% starting balance cap (${currencySymbol}${maxOnePercentRisk.toFixed(0)} max).`;
  } else if (realizedPnL !== undefined && realizedPnL < -maxAllowedLoss) {
    isViolated = true;
    violationReason = `Realized loss (${currencySymbol}${Math.abs(realizedPnL).toFixed(2)}) significantly exceeds your ≤ 1% limit (${currencySymbol}${maxOnePercentRisk.toFixed(0)} + ${currencySymbol}${slippageTolerance.toFixed(0)} slippage buffer).`;
  }

  const statusLabel = isViolated ? 'Risk Cap Violated' : 'Within ≤ 1% Risk Cap';

  return {
    accountBalance,
    currency,
    currencySymbol,
    maxOnePercentRisk,
    plannedRiskPercent,
    plannedRiskAmount,
    realizedPnL,
    isViolated,
    violationReason,
    statusLabel,
  };
};
