export interface TradingQuote {
  text: string;
  author: string;
  category: string;
}

export const TRADING_QUOTES: TradingQuote[] = [
  // ─── 1-20: Risk Management & Capital Defense ──────────────────────────────
  {
    text: "Cut losses without hesitation. Losers average losers.",
    author: "PAUL TUDOR JONES",
    category: "Risk Rule",
  },
  {
    text: "Amateurs obsess over profits. Professionals obsess over managing risk.",
    author: "LARRY HITE",
    category: "Capital Protection",
  },
  {
    text: "The elements of good trading are: 1. Cut losses. 2. Cut losses. 3. Cut losses.",
    author: "ED SEYKOTA",
    category: "Capital Defense",
  },
  {
    text: "It is not whether you are right or wrong, but how much you make when right and lose when wrong.",
    author: "GEORGE SOROS",
    category: "Risk / Reward",
  },
  {
    text: "Markets can remain irrational longer than you can remain solvent. Respect risk.",
    author: "J.M. KEYNES",
    category: "Market Humility",
  },
  {
    text: "Don't focus on making money; focus on protecting what you have.",
    author: "PAUL TUDOR JONES",
    category: "Capital Defense",
  },
  {
    text: "Risk no more than you can afford to lose, and also risk enough so that a win is meaningful.",
    author: "ED SEYKOTA",
    category: "Position Sizing",
  },
  {
    text: "I always define my risk before entering any trade, and I accept the possibility of loss.",
    author: "MARK DOUGLAS",
    category: "Pre-Trade Rule",
  },
  {
    text: "Never turn an intraday trade into an overnight hold to avoid accepting a loss.",
    author: "DISCIPLINE RULE",
    category: "Risk Management",
  },
  {
    text: "The most important rule of trading is to play great defense, not great offense.",
    author: "PAUL TUDOR JONES",
    category: "Capital Defense",
  },
  {
    text: "If you have an approach that makes money, capital preservation is the only game in town.",
    author: "STANLEY DRUCKENMILLER",
    category: "Capital Preservation",
  },
  {
    text: "Always honor your stop-loss. Moving your stop is simply lying to yourself.",
    author: "TRADING RULE",
    category: "Stop-Loss Discipline",
  },
  {
    text: "One catastrophic trade can wipe out months of discipline. Respect your maximum daily loss.",
    author: "PROP DESK RULE",
    category: "Max Daily Loss",
  },
  {
    text: "When in doubt, get out and get a good night's sleep. The market will be here tomorrow.",
    author: "MICHAEL MARCUS",
    category: "Risk Control",
  },
  {
    text: "I am more concerned about controlling the downside than making profits.",
    author: "BRUCE KOVNER",
    category: "Downside Protection",
  },
  {
    text: "Never risk more than 1% to 2% of your total account on any single trade setup.",
    author: "MONEY MANAGEMENT",
    category: "Sizing Rule",
  },
  {
    text: "Your first loss in a trade is always your cheapest loss.",
    author: "WALL STREET ADAGE",
    category: "Loss Acceptance",
  },
  {
    text: "Never add to a losing position. Averaging down is the fastest path to ruin.",
    author: "JESSE LIVERMORE",
    category: "Execution Rule",
  },
  {
    text: "Survival is the only road to success. You must stay in the game to win.",
    author: "ALEXANDER ELDER",
    category: "Longevity",
  },
  {
    text: "A trader without a stop-loss is like a driver without brakes speeding on a mountain road.",
    author: "MARK MINERVINI",
    category: "Risk Discipline",
  },

  // ─── 21-40: Psychology & Emotional Mastery ───────────────────────────────
  {
    text: "If you missed the entry, you missed the trade. Never chase — wait for your setup.",
    author: "KAIZEN",
    category: "Execution Rule",
  },
  {
    text: "The market transfers money from the impatient to the patient.",
    author: "WARREN BUFFETT",
    category: "Patience & Mindset",
  },
  {
    text: "You do not need to know what happens next to make money consistently.",
    author: "MARK DOUGLAS",
    category: "Probabilities",
  },
  {
    text: "Win or lose, everyone gets what they want out of the market.",
    author: "ED SEYKOTA",
    category: "Psychology",
  },
  {
    text: "If trading feels exciting, you are doing it wrong. Elite execution is calm and systematic.",
    author: "GEORGE SOROS",
    category: "Emotional Control",
  },
  {
    text: "Discipline is doing what your plan says, even when your emotions scream otherwise.",
    author: "TRADING PSYCHOLOGY",
    category: "Core Habit",
  },
  {
    text: "Focus on flawless execution of your edge. The profits are merely a byproduct.",
    author: "MARK DOUGLAS",
    category: "Process Focus",
  },
  {
    text: "A red day is never a failure until you fail to learn the lesson from it.",
    author: "BRETT STEENBARGER",
    category: "Growth & Review",
  },
  {
    text: "Emotional stability is the single biggest predictor of long-term trading longevity.",
    author: "TOM BASSO",
    category: "Mental Toughness",
  },
  {
    text: "Do not marry your position. The market has no feelings and owes you nothing.",
    author: "RICHARD DENNIS",
    category: "Objectivity",
  },
  {
    text: "Revenge trading is the ultimate destroyer of trading accounts. Walk away after a loss.",
    author: "PSYCHOLOGY RULE",
    category: "Tilt Management",
  },
  {
    text: "Trade what you actually see on the chart, never what you hope or fear will happen.",
    author: "CHART DISCIPLINE",
    category: "Objectivity",
  },
  {
    text: "Hope is not a trading strategy. Execute the exit when the thesis is invalid.",
    author: "LARRY TENTARELLI",
    category: "Objectivity",
  },
  {
    text: "Confidence comes not from always winning, but from knowing you survive every loss.",
    author: "BRETT STEENBARGER",
    category: "Trader Mindset",
  },
  {
    text: "The best traders eliminate ego. When they are wrong, they simply get out.",
    author: "MARTY SCHWARTZ",
    category: "Ego Management",
  },
  {
    text: "When you trade out of boredom, the market will charge you an expensive entertainment fee.",
    author: "TRADING AXIOM",
    category: "Overtrading",
  },
  {
    text: "Greed turns winning trades into losers. Take your profits at predetermined targets.",
    author: "EXECUTION RULE",
    category: "Profit Taking",
  },
  {
    text: "Fear of missing out (FOMO) creates bad entries. The market has infinite opportunities.",
    author: "MINDSET RULE",
    category: "FOMO Prevention",
  },
  {
    text: "To conquer the market, you must first master yourself.",
    author: "MARK DOUGLAS",
    category: "Self-Mastery",
  },
  {
    text: "Do not let a winning trade make you arrogant, or a losing trade make you despair.",
    author: "TRADING PSYCHOLOGY",
    category: "Equanimity",
  },

  // ─── 41-60: Execution, Edge & System Discipline ──────────────────────────
  {
    text: "The goal of a successful trader is to make the best trades. Money is secondary.",
    author: "ALEXANDER ELDER",
    category: "Professional Mindset",
  },
  {
    text: "Do not trade to get rich quick. Trade to trade well for the rest of your career.",
    author: "MARK MINERVINI",
    category: "Longevity",
  },
  {
    text: "A trading strategy without edge is merely gambling with fancy charts.",
    author: "QUANT PHILOSOPHY",
    category: "Trading Edge",
  },
  {
    text: "Plan your trade, and trade your plan. Deviating in real-time is gambling.",
    author: "CLASSIC PRINCIPLE",
    category: "Trading Plan",
  },
  {
    text: "Consistency is not about never losing; it is about executing your edge every single time.",
    author: "MARK DOUGLAS",
    category: "Consistency",
  },
  {
    text: "Wait for the fat pitch. You do not have to swing at every ball in trading.",
    author: "WARREN BUFFETT",
    category: "Selective Patience",
  },
  {
    text: "Great traders spend 80% of their time waiting and 20% executing with precision.",
    author: "HEDGE FUND DESK",
    category: "Patience",
  },
  {
    text: "If your setup does not trigger today, your job was simply to do nothing.",
    author: "PROP TRADER RULE",
    category: "Non-Action Edge",
  },
  {
    text: "Cash is a position. Sometimes doing nothing is the most profitable trade of the day.",
    author: "JESSE LIVERMORE",
    category: "Patience",
  },
  {
    text: "Your edge does not guarantee any single trade will win — it only guarantees long-term statistics.",
    author: "MARK DOUGLAS",
    category: "Probability Edge",
  },
  {
    text: "Every trade has an outcome that is completely independent from the previous trade.",
    author: "MARK DOUGLAS",
    category: "Independent Trials",
  },
  {
    text: "Stop trying to predict where price is going. React systematically to where it goes.",
    author: "SYSTEM TRADER",
    category: "System Execution",
  },
  {
    text: "Overtrading is a sign of lack of rules. High quality beats high frequency every time.",
    author: "PRACTICAL DISCIPLINE",
    category: "Quality Over Quantity",
  },
  {
    text: "A complete trade journal is your greatest asset. What is measured improves.",
    author: "PETER DRUCKER",
    category: "Journaling",
  },
  {
    text: "Analyze your losing trades ruthlessly. They contain the map to your next breakthrough.",
    author: "RAY DALIO",
    category: "Review Process",
  },
  {
    text: "Do not change your entire strategy because of a normal statistical losing streak.",
    author: "QUANT RULE",
    category: "System Faith",
  },
  {
    text: "Simplicity beats complexity. A clean, repeatable edge beats a chart full of indicators.",
    author: "PRICE ACTION RULE",
    category: "Simplicity",
  },
  {
    text: "Know your invalidation point before you enter. If price hits it, get out without debate.",
    author: "EXECUTION RULE",
    category: "Invalidation Point",
  },
  {
    text: "The trend is your friend until the bend at the end. Trade with market structure.",
    author: "ED SEYKOTA",
    category: "Trend Alignment",
  },
  {
    text: "Trade smaller when you are in a slump. Build confidence with tiny wins first.",
    author: "MARTY SCHWARTZ",
    category: "Drawdown Recovery",
  },

  // ─── 61-80: Legendary Wisdom from Market Wizards ──────────────────────────
  {
    text: "I believe the biggest mistake most traders make is not doing their homework.",
    author: "JIM ROGERS",
    category: "Preparation",
  },
  {
    text: "Throughout my financial career, I have continually witnessed examples of other people that I have known being ruined by a failure to respect risk.",
    author: "MICHAEL MARCUS",
    category: "Risk Respect",
  },
  {
    text: "Money is made by sitting, not trading. Wait for the big moves to unfold.",
    author: "JESSE LIVERMORE",
    category: "Position Holding",
  },
  {
    text: "Whenever I get hit in the market, I immediately cut my position size down to almost nothing.",
    author: "PAUL TUDOR JONES",
    category: "Drawdown Sizing",
  },
  {
    text: "The hard work in trading comes in the preparation. The actual execution should be effortless.",
    author: "MARK MINERVINI",
    category: "Preparation",
  },
  {
    text: "I do not care about the market being right or wrong. I care about my bank balance.",
    author: "ED SEYKOTA",
    category: "Pragmatism",
  },
  {
    text: "The market is a harsh teacher because it gives the test first and the lesson afterward.",
    author: "VERNON LAW",
    category: "Market Lessons",
  },
  {
    text: "Don't be a hero. Don't have an ego. Always question yourself and your ability.",
    author: "PAUL TUDOR JONES",
    category: "Humility",
  },
  {
    text: "If you cannot take a small loss, sooner or later you will take the mother of all losses.",
    author: "ED SEYKOTA",
    category: "Small Losses",
  },
  {
    text: "A lot of people want the prize without the process. Embrace the grind of journaling.",
    author: "TRADING PSYCHOLOGY",
    category: "Process",
  },
  {
    text: "The secret to trading success is emotional resilience. Keep your composure under pressure.",
    author: "JACK SCHWAGER",
    category: "Resilience",
  },
  {
    text: "You have to be willing to make mistakes regularly; there is nothing wrong with it, as long as your losses are small.",
    author: "BRUCE KOVNER",
    category: "Embracing Losses",
  },
  {
    text: "Good traders liquidate when they are wrong. Great traders can reverse and go the other way without ego.",
    author: "STANLEY DRUCKENMILLER",
    category: "Agility",
  },
  {
    text: "Do not confuse luck with skill in a roaring bull market.",
    author: "WALL STREET PROVERB",
    category: "Humility",
  },
  {
    text: "The key to wealth is risk control. If you have 56% win rate, with tight stops, you will be extraordinarily wealthy.",
    author: "WILLIAM O'NEIL",
    category: "Win Rate Truth",
  },
  {
    text: "Trading is a marathon, not a sprint. Pace your energy, risk, and mental capital.",
    author: "PROP DESK PRINCIPLE",
    category: "Endurance",
  },
  {
    text: "There is no holy grail indicator. The edge lies in risk management and psychology.",
    author: "MARK DOUGLAS",
    category: "The Real Edge",
  },
  {
    text: "Let your winners run, cut your losers short. It sounds simple, but requires immense discipline.",
    author: "DAVID RICARDO",
    category: "Asymmetric Returns",
  },
  {
    text: "I just wait until there is money lying in the corner, and all I have to do is go over there and pick it up.",
    author: "JIM ROGERS",
    category: "Extreme Patience",
  },
  {
    text: "Risk control is the foundation upon which all trading fortunes are constructed.",
    author: "PAUL TUDOR JONES",
    category: "Foundation",
  },

  // ─── 81-100: Daily Habits, Routine & Long-Term Mastery ────────────────────
  {
    text: "Before every trading session, check your state of mind. Never trade when tired, angry, or distracted.",
    author: "PRE-SESSION RULE",
    category: "Mental Checklist",
  },
  {
    text: "Professional traders look for reasons NOT to take a trade. Amateurs look for any excuse to jump in.",
    author: "SELECTIVITY RULE",
    category: "High Standards",
  },
  {
    text: "Celebrate the execution of your plan, regardless of whether the trade was a win or a loss.",
    author: "PROCESS PRAISE",
    category: "Positive Reinforcement",
  },
  {
    text: "A single great trading month does not make a career. Consistent discipline across 12 months does.",
    author: "TRADING REALITY",
    category: "Consistency",
  },
  {
    text: "The market will always test your patience before it rewards your discipline.",
    author: "MARKET WISDOM",
    category: "Patience",
  },
  {
    text: "Stop counting profits while the trade is running. Focus on managing the position correctly.",
    author: "IN-TRADE DISCIPLINE",
    category: "Detachment",
  },
  {
    text: "If you violate your rules and win, you still failed. Bad habits will eventually destroy you.",
    author: "PROP FIRM RULE",
    category: "Rule Integrity",
  },
  {
    text: "Your account balance is a scoreboard, not a reflection of your self-worth.",
    author: "BRETT STEENBARGER",
    category: "Self-Worth",
  },
  {
    text: "Discipline is the bridge between trading goals and actual account growth.",
    author: "JIM ROHN",
    category: "Discipline",
  },
  {
    text: "Never risk what you need to gain what you want. That is pure foolishness.",
    author: "WARREN BUFFETT",
    category: "Capital Respect",
  },
  {
    text: "You cannot control the market. You can only control your entry, your size, and your exit.",
    author: "MARK DOUGLAS",
    category: "Locus of Control",
  },
  {
    text: "Every loss is tuition paid to the market. Make sure you graduate with the knowledge.",
    author: "WALL STREET SAYING",
    category: "Learning Curve",
  },
  {
    text: "The greatest enemy of a trader is greed, closely followed by fear, and crowned by impatience.",
    author: "JESSE LIVERMORE",
    category: "The Big Three",
  },
  {
    text: "Treat trading as a serious business, and it will pay you like one. Treat it like a hobby, and it will cost you like one.",
    author: "BUSINESS MINDSET",
    category: "Professionalism",
  },
  {
    text: "Never enter a trade without an exit strategy for both profit and loss scenarios.",
    author: "PRE-TRADE DISCIPLINE",
    category: "Exit Plan",
  },
  {
    text: "When the market proves you wrong, exit immediately. The market doesn't care about your opinion.",
    author: "RANDY MCKAY",
    category: "Decisiveness",
  },
  {
    text: "The market does not reward activity; it rewards selectivity and discipline.",
    author: "TRADING TRUTH",
    category: "Selectivity",
  },
  {
    text: "Your job as a trader is to manage risk, preserve capital, and let probabilities work over time.",
    author: "CORE CREED",
    category: "Trader Creed",
  },
  {
    text: "Consistency is born when you stop caring about any single trade and start thinking in series of 20 trades.",
    author: "MARK DOUGLAS",
    category: "Series Thinking",
  },
  {
    text: "Every morning the market resets. Leave yesterday's results in the past and execute today's edge with clarity.",
    author: "DAILY DISCIPLINE",
    category: "Fresh Slate",
  },
];
