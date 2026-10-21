import { DISCIPLINE_CHECKLIST_ITEMS, ALL_MISTAKE_ITEMS, DEFAULT_DISCIPLINE_CHECKLIST } from '../constants';

export type ExecutionGrade = 'A+' | 'A' | 'B' | 'C';

export interface ExecutionGradeResult {
  grade: ExecutionGrade;
  title: string;
  badgeText: string;
  color: string;
  bgColor: string;
  borderColor: string;
  summaryText: string;
  isInstantKill: boolean;
  instantKillReason?: string;
  violatedRules: string[];
  mistakes: string[];
  deductions: string[];
}

export const CORE_RULE_LABELS: Record<string, string> = {
  // Master Trading Playbook / XAUUSD & Daily Discipline Checks
  htf_level_15m_1h: '15M / 1H Key Level',
  allowed_pattern: 'Valid Setup (QML/ISS4/TJL2/DT-DB)',
  mandatory_confirmation: 'Engulfing / CHOCH Confirmed',
  risk_cap: 'Max 1% Day Risk Cap',
  sl_immediate: 'Hard Structural SL Set',
  zero_sl_widening: 'Never Widened Stop-Loss',
  killzone_execution: 'London / NY Session Only',
  news_window_clear: 'No High-Impact News',
  max_two_trades: 'Max 2 Trades Day Limit',
  min_rr_feasible: 'Target 1:2+ R:R Feasible',
  emotionally_grounded: 'Calm Mindset (No Revenge / FOMO)',
  set_and_forget: 'Set & Forget (No Tampering)',
  plan_followed: 'Followed Master Playbook',
  be_at_1_5rr: 'SL to Breakeven at 1:1.5',
  partial_profit_1_2rr: '40-50% Partials at 1:2',
  no_mid_trade_scaling: 'No Mid-Trade Scaling',
  no_hope_trading: 'Cut Chop Without Ego',
  cooldown_break: '30-45m Break After Loss',
  not_revenge_trade: 'No Revenge / Aar-Paar Mode',
  gold_focus: 'Gold Focus (XAUUSD)',
  zero_noise: 'Zero Trading Noise',

  // Legacy mappings for backward compatibility
  one_and_done: 'Max 2 Trades Day Limit',
  clean_entry_no_chase: "Didn't Chase Price",
  pre_market_routine: '15M / 1H Key Level',
  setup_liquidity_alignment: 'Valid Setup (QML/ISS4/TJL2)',
  not_boredom_trade: 'Not a Boredom Trade',
  candle_close_confirmation: 'Waited for Candle Close',
  be_shift_per_rules: 'SL to Breakeven at 1:1.5',
  let_winners_run: 'Booked Partials at 1:2',
  screen_detached: 'No Mid-Trade Scaling',
};

/**
 * Priority 1: Instant-Kill Check
 * Critical rule breaches that instantly override and assign Grade C
 */
export const INSTANT_KILL_MISTAKE_MAP: Record<string, string> = {
  oversized_lot: 'Lot Size Too Big (>1% Day Risk)',
  widened_stop_loss: 'Moved Stop-Loss Backward',
  widened_sl: 'Moved Stop-Loss Backward',
  revenge_trade: 'Revenge Trade (Anger)',
  aar_paar_mode: 'Aar-Paar Mode (All-or-Nothing / Double Lot)',
  broke_trade_limit: 'Overtraded (>2 Trades Limit)',
  broke_one_and_done: 'Overtraded (>2 Trades Limit)',
  naked_entry: 'No Structural Stop-Loss Set',
};

/**
 * Minor execution / timing error IDs
 */
export const MINOR_EXECUTION_MISTAKES = new Set([
  'jumped_early',
  'chased_price',
  'front_ran_level',
  'choked_trade',
  'enteredEarly',
  'lateEntry',
  'noConfirmation',
]);

/**
 * Pure function: Calculate deterministic Execution Grade based on violated rules and mistakes
 */
export function calculateExecutionGrade(
  checklist?: string[] | null,
  mistakes?: string[] | null,
  isDark = true
): ExecutionGradeResult {
  const checkedList = Array.isArray(checklist) ? checklist : [];
  const checkedSet = new Set(checkedList);

  // Identify which core rules were violated (unchecked from default core rules)
  const violatedRules: string[] = [];
  for (const ruleId of DEFAULT_DISCIPLINE_CHECKLIST) {
    if (!checkedSet.has(ruleId)) {
      violatedRules.push(CORE_RULE_LABELS[ruleId] || ruleId);
    }
  }

  const rawMistakes = Array.isArray(mistakes) ? mistakes : [];
  // Filter out the 'none_flawless' safe state
  const activeMistakes = rawMistakes.filter((m) => m && m !== 'none_flawless');

  // Resolve human-readable labels for active deductions / mistakes
  const mistakeLabels: string[] = activeMistakes.map((mId) => {
    if (INSTANT_KILL_MISTAKE_MAP[mId]) return INSTANT_KILL_MISTAKE_MAP[mId];
    const found = ALL_MISTAKE_ITEMS.find((item) => item.id === mId);
    return found ? found.label : mId;
  });

  // ── Priority 1: Instant-Kill Check ──────────────────────────────────────
  const triggeredInstantKill = activeMistakes.find((m) => !!INSTANT_KILL_MISTAKE_MAP[m]);
  const instantKillRuleBreach =
    !checkedSet.has('risk_cap') ||
    !checkedSet.has('zero_sl_widening') ||
    !checkedSet.has('sl_immediate') ||
    (!checkedSet.has('max_two_trades') && !checkedSet.has('one_and_done'));

  if (triggeredInstantKill || instantKillRuleBreach) {
    const reason = triggeredInstantKill
      ? INSTANT_KILL_MISTAKE_MAP[triggeredInstantKill]
      : !checkedSet.has('risk_cap')
      ? 'Risk Cap Breached (>1%)'
      : !checkedSet.has('sl_immediate')
      ? 'No Structural SL Set'
      : !checkedSet.has('zero_sl_widening')
      ? 'Stop Loss Widened'
      : 'Overtraded (>2 Trades Limit)';

    return {
      grade: 'C',
      title: 'Grade C (Discipline Breach)',
      badgeText: 'Grade C (Discipline Breach)',
      color: '#EF4444',
      bgColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
      summaryText: `CRITICAL BREACH: "${reason}" | Auto-Locked to Grade C`,
      isInstantKill: true,
      instantKillReason: reason,
      violatedRules,
      mistakes: mistakeLabels,
      deductions: mistakeLabels,
    };
  }

  // ── Priority 2: Standard Grading Tiers ──────────────────────────────────
  let grade: ExecutionGrade = 'C';
  let title = 'Grade C (Discipline Breach)';
  let badgeText = 'Grade C (Discipline Breach)';
  let color = '#EF4444';
  let bgColor = isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2';
  let borderColor = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';

  const totalErrors = violatedRules.length + mistakeLabels.length;

  if (totalErrors === 0) {
    // Grade A+ (Textbook Execution - 0 Violations)
    grade = 'A+';
    title = 'Grade A+ (Textbook Execution)';
    badgeText = 'Grade A+ (Textbook)';
    color = '#10B981';
    bgColor = isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4';
    borderColor = isDark ? 'rgba(16, 185, 129, 0.35)' : '#BBF7D0';
  } else if (totalErrors === 1) {
    // Grade B (Single Minor Flaw / Frictional Error)
    grade = 'B';
    title = 'Grade B (Minor Flaw)';
    badgeText = 'Grade B (Minor Flaw)';
    color = '#F59E0B';
    bgColor = isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB';
    borderColor = isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A';
  } else {
    // Grade C (Multiple Breaches / Errors)
    grade = 'C';
    title = 'Grade C (Discipline Breach)';
    badgeText = 'Grade C (Discipline Breach)';
    color = '#EF4444';
    bgColor = isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2';
    borderColor = isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA';
  }

  // Summary breakdown without any discipline score numbers
  let summaryText = '';
  if (violatedRules.length > 0 && mistakeLabels.length > 0) {
    summaryText = `${violatedRules.length} Rule Violation${violatedRules.length > 1 ? 's' : ''} • ${mistakeLabels.length} Mistake${mistakeLabels.length > 1 ? 's' : ''}`;
  } else if (violatedRules.length > 0) {
    summaryText = `Violated: ${violatedRules.join(', ')}`;
  } else if (mistakeLabels.length > 0) {
    summaryText = `Mistakes: ${mistakeLabels.join(', ')}`;
  } else {
    summaryText = 'Followed all rules cleanly • 0 mistakes tagged';
  }

  return {
    grade,
    title,
    badgeText,
    color,
    bgColor,
    borderColor,
    summaryText,
    isInstantKill: false,
    violatedRules,
    mistakes: mistakeLabels,
    deductions: mistakeLabels,
  };
}

