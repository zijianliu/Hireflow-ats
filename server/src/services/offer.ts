import prisma from '../lib/prisma';
import { OfferStatus, CandidateStage, ActionType, Role } from '@prisma/client';
import { getAccessibleJobIds } from './common';

export interface CreateOfferData {
  candidateId: string;
  jobId: string;
  salaryRange: string;
  onboardDate: Date;
  remark?: string;
}

export interface OfferQueryParams {
  candidateId?: string;
  jobId?: string;
  status?: OfferStatus;
  page?: number;
  pageSize?: number;
}

export async function createOffer(data: CreateOfferData, operatorId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: data.candidateId },
  });

  if (!candidate) {
    throw new Error('候选人不存在');
  }

  if (candidate.stage !== CandidateStage.OFFER) {
    throw new Error('只有当前阶段为Offer的候选人才能创建Offer');
  }

  const existingOffer = await prisma.offer.findFirst({
    where: {
      candidateId: data.candidateId,
      jobId: data.jobId,
      status: { in: [OfferStatus.PENDING, OfferStatus.ACCEPTED] },
    },
  });

  if (existingOffer) {
    throw new Error('同一候选人同一职位只能有一个有效Offer');
  }

  return prisma.$transaction(async (tx) => {
    const offer = await tx.offer.create({
      data: {
        candidateId: data.candidateId,
        jobId: data.jobId,
        salaryRange: data.salaryRange,
        onboardDate: data.onboardDate,
        remark: data.remark,
        createdById: operatorId,
      },
    });

    await tx.timelineEvent.create({
      data: {
        candidateId: data.candidateId,
        actionType: ActionType.OFFER_CREATED,
        operatorId,
        description: `创建Offer: 薪资范围 ${data.salaryRange}, 入职日期 ${data.onboardDate.toLocaleDateString()}`,
      },
    });

    return offer;
  });
}

export async function updateOfferStatus(id: string, status: OfferStatus, operatorId: string) {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) {
    throw new Error('Offer不存在');
  }

  return prisma.$transaction(async (tx) => {
    const updatedOffer = await tx.offer.update({
      where: { id },
      data: { status },
    });

    await tx.timelineEvent.create({
      data: {
        candidateId: offer.candidateId,
        actionType: ActionType.OFFER_UPDATED,
        operatorId,
        description: `Offer状态变更: ${offer.status} -> ${status}`,
      },
    });

    return updatedOffer;
  });
}

export async function getOfferById(id: string) {
  return prisma.offer.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, phone: true, email: true } },
      job: { select: { id: true, title: true, department: true } },
      createdBy: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function getOfferList(params: OfferQueryParams, userId: string, userRole: Role) {
  const { candidateId, jobId, status, page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (userRole === Role.HR) {
    const jobFilter = getAccessibleJobIds(userId, userRole);
    where.job = jobFilter as any;
  }

  if (candidateId) where.candidateId = candidateId;
  if (jobId) where.jobId = jobId;
  if (status) where.status = status;

  const [list, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.offer.count({ where }),
  ]);

  return { list, total, page, pageSize };
}
