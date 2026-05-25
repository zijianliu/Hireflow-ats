import { Router, Request, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { login, getCurrentUser, getUserList } from '../services/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    const result = await login(username, password);
    res.json({ code: 0, data: result });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getCurrentUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 0, data: user });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await getUserList();
    res.json({ code: 0, data: users });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;
