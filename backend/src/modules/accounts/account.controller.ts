import { Response, NextFunction } from 'express';
import { accountService } from './account.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';

export const createAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const account = await accountService.createAccount(req.userId!, req.body);
    sendCreated(res, account, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

export const getAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accounts = await accountService.getAccounts(req.userId!);
    sendSuccess(res, accounts);
  } catch (error) {
    next(error);
  }
};

export const getAccountById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const account = await accountService.getAccountById(req.userId!, req.params.id);
    sendSuccess(res, account);
  } catch (error) {
    next(error);
  }
};

export const getDefaultAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const account = await accountService.getDefaultAccount(req.userId!);
    sendSuccess(res, account);
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const account = await accountService.updateAccount(req.userId!, req.params.id, req.body);
    sendSuccess(res, account, 'Account updated successfully');
  } catch (error) {
    next(error);
  }
};

export const setDefaultAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const account = await accountService.setDefaultAccount(req.userId!, req.params.id);
    sendSuccess(res, account, 'Default account updated');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await accountService.deleteAccount(req.userId!, req.params.id);
    sendSuccess(res, null, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};
