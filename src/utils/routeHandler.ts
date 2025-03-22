import { Request, Response, RequestHandler } from 'express';

// This type assertion function helps TypeScript understand that our controller
// can be used as an Express RequestHandler despite returning a Response
export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<Response>): RequestHandler =>
  (req, res, next): void => {
    Promise.resolve(fn(req, res)).catch(next);
  };
