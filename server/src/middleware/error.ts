import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('[Error]', err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ code: 404, message: '接口不存在' });
}

export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      res.status(400).json({ code: 400, message: '参数校验失败', errors: err.errors });
    }
  };
}
