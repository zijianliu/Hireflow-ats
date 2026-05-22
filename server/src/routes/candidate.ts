import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/auth';
import {
  createCandidate,
  updateCandidate,
  getCandidateById,
  getCandidateList,
  changeStage,
} from '../services/candidate';
import { canAccessCandidate } from '../services/common';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', requireRoles(Role.HR, Role.ADMIN), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const ownerId = data.ownerId || req.user!.userId;
    const candidate = await createCandidate({ ...data, ownerId });
    res.json({ code: 0, data: candidate });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.put('/:id', requireRoles(Role.HR, Role.ADMIN), async (req: AuthRequest, res) => {
  try {
    const candidate = await updateCandidate(req.params.id, req.body);
    res.json({ code: 0, data: candidate });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const candidate = await getCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ code: 404, message: '候选人不存在' });
    }
    const canAccess = await canAccessCandidate(req.user!.userId, req.user!.role as Role, req.params.id);
    if (!canAccess) {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }
    res.json({ code: 0, data: candidate });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const params = {
      name: req.query.name as string | undefined,
      phone: req.query.phone as string | undefined,
      email: req.query.email as string | undefined,
      jobId: req.query.jobId as string | undefined,
      stage: req.query.stage as any,
      source: req.query.source as any,
      ownerId: req.query.ownerId as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };
    const result = await getCandidateList(params, req.user!.userId, req.user!.role as Role);
    res.json({ code: 0, data: result });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.post('/:id/change-stage', requireRoles(Role.HR, Role.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { newStage, description } = req.body;
    if (!newStage) {
      return res.status(400).json({ code: 400, message: '新阶段不能为空' });
    }
    const candidate = await changeStage(req.params.id, newStage, req.user!.userId, description);
    res.json({ code: 0, data: candidate });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;
