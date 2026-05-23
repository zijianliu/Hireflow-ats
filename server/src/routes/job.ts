import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/auth';
import {
  createJob,
  updateJob,
  closeJob,
  reopenJob,
  pauseJob,
  getJobById,
  getJobList,
} from '../services/job';

const router = Router();

router.post('/', requireRoles('HR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const ownerId = data.ownerId || req.user!.userId;
    const job = await createJob({ ...data, ownerId });
    res.json({ code: 0, data: job });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.put('/:id', requireRoles('HR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const job = await updateJob(req.params.id, req.body);
    res.json({ code: 0, data: job });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.patch('/:id/close', requireRoles('HR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const job = await closeJob(req.params.id);
    res.json({ code: 0, data: job });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.patch('/:id/reopen', requireRoles('HR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const job = await reopenJob(req.params.id);
    res.json({ code: 0, data: job });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.patch('/:id/pause', requireRoles('HR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const job = await pauseJob(req.params.id);
    res.json({ code: 0, data: job });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ code: 404, message: '职位不存在' });
    }
    res.json({ code: 0, data: job });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const params = {
      title: req.query.title as string | undefined,
      department: req.query.department as string | undefined,
      location: req.query.location as string | undefined,
      status: req.query.status as any,
      ownerId: req.query.ownerId as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };
    const result = await getJobList(params, req.user!.userId, req.user!.role as string);
    res.json({ code: 0, data: result });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;