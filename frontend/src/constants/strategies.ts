export interface StrategyCategory {
  title: string;
  options: string[];
}

export interface PrimaryStrategy {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;
  categories?: StrategyCategory[];
  options?: string[];
  confluences?: string[];
}

export const PRIMARY_STRATEGIES: PrimaryStrategy[] = [
  {
    id: 'topg',
    name: 'TOPG Strategy',
    shortLabel: 'TOPG',
    description: 'Flagship institutional sweep & structure confirmation system',
    icon: 'trophy',
    color: '#3B82F6',
    categories: [
      {
        title: 'TJL Levels (Shelves)',
        options: ['BUY TJL1', 'BUY TJL2', 'SELL TJL1', 'SELL TJL2'],
      },
      {
        title: 'Reversals & Flips',
        options: ['BUY QML', 'SELL QML', 'RBS', 'SBR', 'Double Bottom (DB)', 'Double Top (DT)'],
      },
      {
        title: 'D-CHOCH Levels',
        options: [
          'D-CHOCH BUY QML',
          'D-CHOCH SELL QML',
          'D-CHOCH RBS',
          'D-CHOCH SBR',
          'D-CHOCH DB',
          'D-CHOCH DT',
        ],
      },
      {
        title: 'Continuation',
        options: ['ISS 4 Confirmation'],
      },
    ],
    confluences: [
      'OTE (0.618 - 0.786 Fib)',
      '0.50 Equilibrium',
      'PDH / PDL Sweep',
      'Asian Sweep',
    ],
  },
  {
    id: 'smc_ict',
    name: 'Classic SMC / ICT',
    shortLabel: 'SMC/ICT',
    description: 'Smart money concepts, order blocks & fair value gaps',
    icon: 'layers',
    color: '#8B5CF6',
    options: [
      'Order Block (OB) + FVG Mitigation',
      'Judas Swing (Session Open Trap)',
      'Breaker Block Retest',
      'Pro-Trend BOS Continuation',
      'Silver Bullet FVG Entry',
    ],
  },
  {
    id: 'liquidity_sweep',
    name: 'Liquidity Sweep',
    shortLabel: 'Liquidity',
    description: 'Stop hunts and high/low liquidity raids',
    icon: 'water',
    color: '#06B6D4',
    options: [
      'PDH / PDL Sweep & Reversal',
      'Asian High / Low Sweep',
      'Equal Highs / Equal Lows (EQH/EQL) Raid',
      'Major Swing High/Low Wick Rejection',
    ],
  },
  {
    id: 'breakout_retest',
    name: 'Breakout & Retest',
    shortLabel: 'Breakout',
    description: 'Structural expansion and key level retests',
    icon: 'trending-up',
    color: '#10B981',
    options: [
      'Key Support & Resistance Retest',
      'Trendline / Structure Retest',
      'Range Compression Expansion',
    ],
  },
  {
    id: 'discipline_breach',
    name: 'Discipline Breach / Mistake',
    shortLabel: 'Mistake',
    description: 'Self-audit off-plan entries & psychological leaks',
    icon: 'alert-circle',
    color: '#EF4444',
    options: [
      'FOMO / Chased Running Candle',
      'Revenge Entry (Post-Loss)',
      'Mid-Range Chop / Boredom Trade',
      'News Gamble',
    ],
  },
];
