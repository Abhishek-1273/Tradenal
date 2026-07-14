import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { userRepository } from '../../repositories/user.repository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
  ChangePasswordInput,
  UpdateSettingsInput,
} from './auth.schema';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Record<string, unknown>;
  tokens: AuthTokens;
}

class AuthService {
  // ─── Register ─────────────────────────────────────────────────────────────
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password: input.password,
    });

    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    await userRepository.addRefreshToken(user._id.toString(), refreshToken);

    logger.info(`New user registered: ${user.email}`);

    return {
      user: user.toSafeObject(),
      tokens: { accessToken, refreshToken },
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await userRepository.findByEmailWithTokens(input.email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    // Keep max 5 refresh tokens per user (multi-device support)
    const tokens = user.refreshTokens || [];
    if (tokens.length >= 5) {
      tokens.shift(); // Remove oldest
    }
    tokens.push(refreshToken);

    await userRepository.updateById(user._id.toString(), {
      refreshTokens: tokens,
      lastLoginAt: new Date(),
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: user.toSafeObject(),
      tokens: { accessToken, refreshToken },
    };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────
  async refreshToken(input: RefreshTokenInput): Promise<AuthTokens> {
    let decoded: { userId: string; email: string };

    try {
      decoded = verifyRefreshToken(input.refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await userRepository.findByIdWithTokens(decoded.userId);

    if (!user || !user.isActive) {
      throw new AppError('User not found', 401);
    }

    // Verify token is in the stored list (rotation security)
    if (!user.refreshTokens?.includes(input.refreshToken)) {
      // Potential token reuse attack — revoke all tokens
      await userRepository.removeAllRefreshTokens(decoded.userId);
      throw new AppError('Refresh token reuse detected. Please login again.', 401);
    }

    const accessToken = generateAccessToken(decoded.userId, decoded.email);
    const newRefreshToken = generateRefreshToken(decoded.userId, decoded.email);

    // Rotate: remove old, add new
    await userRepository.updateById(decoded.userId, {
      $pull: { refreshTokens: input.refreshToken },
    });
    await userRepository.addRefreshToken(decoded.userId, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  async logout(userId: string, refreshToken: string): Promise<void> {
    await userRepository.removeRefreshToken(userId, refreshToken);
    logger.info(`User logged out: ${userId}`);
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await userRepository.findByEmail(input.email);

    // Don't reveal if email exists
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.updateById(user._id.toString(), {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires,
    });

    try {
      await this.sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (error) {
      logger.error('Nodemailer error:', error);
      await userRepository.updateById(user._id.toString(), {
        $unset: { passwordResetToken: '', passwordResetExpires: '' },
      });
      throw new AppError('Failed to send reset email. Please try again.', 500);
    }

    logger.info(`Password reset requested for: ${user.email}`);
  }

  // ─── Reset Password ───────────────────────────────────────────────────────
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(input.token).digest('hex');

    const user = await userRepository.findByResetToken(hashedToken);

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = input.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all existing refresh tokens after password reset
    await userRepository.removeAllRefreshTokens(user._id.toString());

    logger.info(`Password reset for: ${user.email}`);
  }

  // ─── Change Password ──────────────────────────────────────────────────────
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await userRepository.findOne({ _id: userId });
    if (!user) throw new AppError('User not found', 404);

    // Need password field
    const userWithPassword = await userRepository.findByEmail(user.email);
    if (!userWithPassword) throw new AppError('User not found', 404);

    const isValid = await userWithPassword.comparePassword(input.currentPassword);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    userWithPassword.password = input.newPassword;
    await userWithPassword.save();

    await userRepository.removeAllRefreshTokens(userId);
    logger.info(`Password changed for: ${userId}`);
  }

  // ─── Update Settings ──────────────────────────────────────────────────────
  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<Record<string, unknown>> {
    const updateData: Record<string, unknown> = {};

    if (input.theme !== undefined) updateData['settings.theme'] = input.theme;
    if (input.currency !== undefined) updateData['settings.currency'] = input.currency;
    if (input.defaultRisk !== undefined) updateData['settings.defaultRisk'] = input.defaultRisk;
    if (input.defaultRR !== undefined) updateData['settings.defaultRR'] = input.defaultRR;
    if (input.timezone !== undefined) updateData['settings.timezone'] = input.timezone;
    if (input.brokerGmtOffset !== undefined) updateData['settings.brokerGmtOffset'] = input.brokerGmtOffset;
    if (input.notifications) {
      Object.entries(input.notifications).forEach(([key, val]) => {
        updateData[`settings.notifications.${key}`] = val;
      });
    }

    const user = await userRepository.updateById(userId, { $set: updateData });
    if (!user) throw new AppError('User not found', 404);

    return user.toSafeObject();
  }

  // ─── Delete Account ───────────────────────────────────────────────────────
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await userRepository.findOne({ _id: userId });
    if (!user) throw new AppError('User not found', 404);

    const userWithPassword = await userRepository.findByEmail(user.email);
    if (!userWithPassword) throw new AppError('User not found', 404);

    const isValid = await userWithPassword.comparePassword(password);
    if (!isValid) throw new AppError('Password is incorrect', 400);

    await userRepository.deactivateAccount(userId);
    logger.info(`Account deactivated: ${userId}`);
  }

  // ─── Get Me ───────────────────────────────────────────────────────────────
  async getMe(userId: string): Promise<Record<string, unknown>> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user.toSafeObject();
  }

  // ─── Email Helpers ────────────────────────────────────────────────────────
  private async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string
  ): Promise<void> {
    if (!env.SMTP_HOST) {
      logger.warn('SMTP not configured. Reset token:', token);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"${env.FROM_NAME}" <${env.FROM_EMAIL}>`,
      to: email,
      subject: 'Tradenal – Reset Your Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hi ${name},</p>
          <p>You requested a password reset. Click the button below to reset it.</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 16px 0;
          ">Reset Password</a>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }
}

export const authService = new AuthService();
