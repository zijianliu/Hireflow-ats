import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/auth';
import {
  createOffer,
  updateOfferStatus,
  getOfferById,
  getOfferList,
} from '../services/offer';

const router = Router();

router.post('/', requireRoles('HR', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    if (data.onboardDate) {
      data.onboardDate = new Date(data.onboardDate);
    }
    const offer = await createOffer(data, req.user!.userId);
    res.json({ code: 0, data: offer });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.patch('/:id/status', requireRoles('HR', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ code: 400, message: '状态不能为空' });
    }
    const offer = await updateOfferStatus(req.params.id, status, req.user!.userId);
    res.json({ code: 0, data: offer });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const offer = await getOfferById(req.params.id);
    if (!offer) {
      return res.status(404).json({ code: 404, message: 'Offer不存在' });
    }
    res.json({ code: 0, data: offer });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const params = {
      candidateId: req.query.candidateId as string | undefined,
      jobId: req.query.jobId as string | undefined,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };
    const result = await getOfferList(params, req.user!.userId, req.user!.role as string);
    res.json({ code: 0, data: result });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;