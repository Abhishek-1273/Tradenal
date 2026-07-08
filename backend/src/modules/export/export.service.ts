import dayjs from 'dayjs';
import { tradeRepository, TradeFilters } from '../../repositories/trade.repository';
import { calculateStats } from '../../utils/calculations';
import { ITrade } from '../../models/Trade.model';

class ExportService {
  // ─── CSV Export ────────────────────────────────────────────────────────────
  async exportCSV(userId: string, filters: Partial<TradeFilters>): Promise<string> {
    const trades = await tradeRepository.findForStats({ userId, ...filters });

    const headers = [
      'Date',
      'Pair',
      'Type',
      'Session',
      'Setup',
      'Entry',
      'Stop Loss',
      'Take Profit',
      'Exit',
      'Lot Size',
      'Risk %',
      'RR',
      'R-Multiple',
      'PnL',
      'Duration (min)',
      'Result',
      'Emotion Before',
      'Emotion After',
      'Followed Plan',
      'Revenge Trade',
      'Overtraded',
      'Moved SL',
      'Mistakes',
      'Tags',
      'Notes',
    ];

    const rows = trades.map((t) => [
      dayjs(t.tradeDate).format('YYYY-MM-DD'),
      t.pair,
      t.tradeType,
      t.session,
      t.setup || '',
      t.entryPrice,
      t.stopLoss,
      t.takeProfit,
      t.exitPrice || '',
      t.lotSize,
      t.riskPercent,
      t.riskReward || '',
      t.rMultiple || '',
      t.pnl || '',
      t.tradeDurationMinutes || '',
      t.result,
      t.emotionBefore || '',
      t.emotionAfter || '',
      t.followedPlan ? 'Yes' : 'No',
      t.revengeTrade ? 'Yes' : 'No',
      t.overtraded ? 'Yes' : 'No',
      t.movedSL ? 'Yes' : 'No',
      t.mistakes.join('; '),
      t.tags.join('; '),
      (t.notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  // ─── JSON Export ───────────────────────────────────────────────────────────
  async exportJSON(userId: string, filters: Partial<TradeFilters>): Promise<Record<string, unknown>> {
    const trades = await tradeRepository.findForStats({ userId, ...filters });
    const stats = calculateStats(trades);

    return {
      exportedAt: new Date().toISOString(),
      totalTrades: trades.length,
      statistics: stats,
      trades: trades.map((t) => this.serializeTrade(t)),
    };
  }

  private serializeTrade(t: ITrade): Record<string, unknown> {
    return {
      id: t._id,
      date: t.tradeDate,
      pair: t.pair,
      tradeType: t.tradeType,
      session: t.session,
      setup: t.setup,
      entryPrice: t.entryPrice,
      stopLoss: t.stopLoss,
      takeProfit: t.takeProfit,
      exitPrice: t.exitPrice,
      lotSize: t.lotSize,
      riskPercent: t.riskPercent,
      riskReward: t.riskReward,
      rMultiple: t.rMultiple,
      pnl: t.pnl,
      tradeDurationMinutes: t.tradeDurationMinutes,
      result: t.result,
      emotionBefore: t.emotionBefore,
      emotionAfter: t.emotionAfter,
      followedPlan: t.followedPlan,
      revengeTrade: t.revengeTrade,
      overtraded: t.overtraded,
      movedSL: t.movedSL,
      movedTP: t.movedTP,
      newsTrade: t.newsTrade,
      mistakes: t.mistakes,
      tags: t.tags,
      reasonForEntry: t.reasonForEntry,
      notes: t.notes,
      screenshots: t.screenshots,
      createdAt: t.createdAt,
    };
  }
}

export const exportService = new ExportService();
