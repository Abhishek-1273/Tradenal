import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const RETRY_DELAY = 5000;
const MAX_RETRIES = 5;

export const connectDatabase = async (retries = MAX_RETRIES): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
  } catch (error) {
    logger.error(`MongoDB connection failed. Retries left: ${retries}`);

    if (retries > 0) {
      logger.info(`Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY));
      return connectDatabase(retries - 1);
    }

    logger.error('Max retries reached. Exiting...');
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
};
