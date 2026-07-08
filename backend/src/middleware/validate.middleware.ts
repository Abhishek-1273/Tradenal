import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendBadRequest } from '../utils/apiResponse';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: AnyZodObject, target: ValidationTarget = 'body') =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }
      next(error);
    }
  };
