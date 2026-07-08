/**
 * Migration: Multi-Account Foundation (Phase 1)
 *
 * This script is SAFE and IDEMPOTENT:
 * - Skips users who already have at least one Account document.
 * - Skips trades that already have an accountId set.
 * - Skips goals that already have an accountId set.
 * - Running it a second time produces zero changes.
 *
 * Usage (from the backend/ directory):
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrate-accounts.ts
 *
 * Or via npm script (add to package.json if desired):
 *   "migrate:accounts": "ts-node -r tsconfig-paths/register src/scripts/migrate-accounts.ts"
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User.model';
import { Account } from '../models/Account.model';
import { Trade } from '../models/Trade.model';
import { Goal } from '../models/Goal.model';

const run = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const users = await User.find({}, '_id email settings').exec();
  console.log(`📋 Found ${users.length} user(s) to process`);

  let createdAccounts = 0;
  let skippedUsers = 0;
  let migratedTrades = 0;
  let skippedTrades = 0;
  let migratedGoals = 0;
  let skippedGoals = 0;

  for (const user of users) {
    const userId = user._id.toString();

    // ── Check if user already has any account ─────────────────────────────────
    const existingAccountCount = await Account.countDocuments({ userId: user._id }).exec();
    if (existingAccountCount > 0) {
      console.log(`⏭️  User ${user.email} already has ${existingAccountCount} account(s). Skipping account creation.`);
      skippedUsers++;

      // Still check if there are any un-migrated trades (accountId = null)
      const unmigratedTradeCount = await Trade.countDocuments({
        userId: user._id,
        accountId: { $exists: false },
      }).exec();

      if (unmigratedTradeCount > 0) {
        // Find their default account to assign to
        const defaultAccount = await Account.findOne({ userId: user._id, isDefault: true }).exec();
        if (defaultAccount) {
          const result = await Trade.updateMany(
            { userId: user._id, accountId: { $exists: false } },
            { $set: { accountId: defaultAccount._id } }
          ).exec();
          migratedTrades += result.modifiedCount;
          console.log(`   → Backfilled ${result.modifiedCount} trade(s) with existing default account`);
        }
      } else {
        skippedTrades++;
      }

      // Check un-migrated goals
      const unmigratedGoalCount = await Goal.countDocuments({
        userId: user._id,
        accountId: { $exists: false },
      }).exec();

      if (unmigratedGoalCount > 0) {
        const defaultAccount = await Account.findOne({ userId: user._id, isDefault: true }).exec();
        if (defaultAccount) {
          const result = await Goal.updateMany(
            { userId: user._id, accountId: { $exists: false } },
            { $set: { accountId: defaultAccount._id } }
          ).exec();
          migratedGoals += result.modifiedCount;
          console.log(`   → Backfilled ${result.modifiedCount} goal(s) with existing default account`);
        }
      }

      continue;
    }

    // ── Create the default account for this user ──────────────────────────────
    const currency = (user as any).settings?.currency || 'USD';
    const newAccount = new Account({
      userId: user._id,
      name: 'My Trading Account',
      accountType: 'personal',
      currency: currency.toUpperCase(),
      startingBalance: 0,
      isDefault: true,
      status: 'active',
    });
    await newAccount.save();
    createdAccounts++;
    console.log(`✅ Created default account for user ${user.email} (currency: ${currency})`);

    // ── Backfill all trades that don't have an accountId ──────────────────────
    const tradeResult = await Trade.updateMany(
      { userId: user._id, accountId: { $exists: false } },
      { $set: { accountId: newAccount._id } }
    ).exec();
    migratedTrades += tradeResult.modifiedCount;
    console.log(`   → Migrated ${tradeResult.modifiedCount} trade(s)`);

    // ── Backfill all goals that don't have an accountId ───────────────────────
    const goalResult = await Goal.updateMany(
      { userId: user._id, accountId: { $exists: false } },
      { $set: { accountId: newAccount._id } }
    ).exec();
    migratedGoals += goalResult.modifiedCount;
    console.log(`   → Migrated ${goalResult.modifiedCount} goal(s)`);
  }

  console.log('\n─────────────────────────────────────────');
  console.log('📊 Migration Summary:');
  console.log(`   Accounts created:     ${createdAccounts}`);
  console.log(`   Users skipped:        ${skippedUsers} (already had accounts)`);
  console.log(`   Trades migrated:      ${migratedTrades}`);
  console.log(`   Trades skipped:       ${skippedTrades}`);
  console.log(`   Goals migrated:       ${migratedGoals}`);
  console.log(`   Goals skipped:        ${skippedGoals}`);
  console.log('─────────────────────────────────────────');
  console.log('✅ Migration complete!');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
