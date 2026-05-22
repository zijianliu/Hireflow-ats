import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/auth';
import {
  createInterview,
  updateInterview,
  cancelInterview,
  getInterviewById,
  getInterviewList,
} from '../services/interview';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', requireRoles(Role.HR, Role.ADMIN), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const interview = await createInterview(data, req.user!.userId);
    res.json({ code: 0, data: interview });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.put('/:id', requireRoles(Role.HR, Role.ADMIN), async (req: AuthRequest, res) => {
  try {
    const interview = await updateInterview(req.params.id, req.body);
    res.json({ code: 0, data: interview });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.patch('/:id/cancel', requireRoles(Role.HR, Role.ADMIN), async (req: AuthRequest, res) => {
  try {
    const interview = await cancelInterview(req.params.id, req.user!.userId);
    res.json({ code: 0, data: interview });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const interview = await getInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ code: 404, message: '面试不存在' });
    }
    if (req.user!.role === Role.INTERVIEWER && interview.interviewerId !== req.user!.userId) {
      return res.status(403).json({ code: 403, message: '面试官不能查看未分配给自己的面试' });
    }
    res.json({ code: 0, data: interview });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const params = {
      interviewerId: req.query.interviewerId as string | undefined,
      candidateId: req.query.candidateId as string | undefined,
      jobId: req.query.jobId as string | undefined,
      status: req.query.status as any,
      startTimeFrom: req.query.startTimeFrom ? new Date(req.query.startTimeFrom as string) : undefined,
      startTimeTo: req.query.startTimeTo ? new Date(req.query.startTimeTo as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };
    const result = await getInterviewList(params, req.user!.userId, req.user!.role as Role);
    res.json({ code: 0, data: result });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;
