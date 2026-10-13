import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../utils/http-errors';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new BadRequestError(result.error.issues.map((i) => i.message).join(' ')));
      return;
    }
    req.body = result.data;
    next();
  };
}
