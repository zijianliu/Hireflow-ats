import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/auth';
import { getDashboardStats } from '../services/dashboard';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireRoles(Role.HR, Role.ADMIN), async (req: AuthRequest, res) => {
  try {
    const params = {
      jobId: req.query.jobId as string | undefined,
      department: req.query.department as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };
    const result = await getDashboardStats(params, req.user!.userId, req.user!.role as Role);
    res.json({ code: 0, data: result });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;
