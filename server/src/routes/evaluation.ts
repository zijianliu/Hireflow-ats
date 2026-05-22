import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createEvaluation,
  getEvaluationByInterviewId,
  getEvaluationsByCandidateId,
} from '../services/evaluation';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const evaluation = await createEvaluation(data, req.user!.userId);
    res.json({ code: 0, data: evaluation });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/interview/:interviewId', async (req: AuthRequest, res) => {
  try {
    const evaluation = await getEvaluationByInterviewId(
      req.params.interviewId,
      req.user!.userId,
      req.user!.role as Role
    );
    res.json({ code: 0, data: evaluation });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/candidate/:candidateId', async (req: AuthRequest, res) => {
  try {
    const evaluations = await getEvaluationsByCandidateId(
      req.params.candidateId,
      req.user!.userId,
      req.user!.role as Role
    );
    res.json({ code: 0, data: evaluations });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;
