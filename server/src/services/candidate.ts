import prisma from '../lib/prisma';
import { canTransition, isTerminalStage, createTimelineEvent, getAccessibleJobIds } from './common';

export interface CreateCandidateData {
  name: string;
  phone: string;
  email: string;
  resumeUrl?: string;
  source: string;
  jobId: string;
  ownerId: string;
  remark?: string;
}

export interface UpdateCandidateData {
  name?: string;
  phone?: string;
  email?: string;
  resumeUrl?: string;
  source?: string;
  remark?: string;
}

export interface CandidateQueryParams {
  name?: string;
  phone?: string;
  email?: string;
  jobId?: string;
  stage?: string;
  source?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
}

export async function createCandidate(data: CreateCandidateData) {
  const job = await prisma.job.findUnique({ where: { id: data.jobId } });
  if (!job) {
    throw new Error('职位不存在');
  }
  if (job.status === 'CLOSED') {
    throw new Error('已关闭职位不能新增候选人');
  }

  const existingByPhone = await prisma.candidate.findFirst({
    where: { jobId: data.jobId, phone: data.phone },
  });
  if (existingByPhone) {
    throw new Error('同一职位下候选人手机号不能重复');
  }

  const existingByEmail = await prisma.candidate.findFirst({
    where: { jobId: data.jobId, email: data.email },
  });
  if (existingByEmail) {
    throw new Error('同一职位下候选人邮箱不能重复');
  }

  return prisma.candidate.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      resumeUrl: data.resumeUrl,
      source: data.source,
      jobId: data.jobId,
      ownerId: data.ownerId,
      remark: data.remark,
    },
    include: {
      job: { select: { id: true, title: true, department: true } },
      owner: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function updateCandidate(id: string, data: UpdateCandidateData) {
  return prisma.candidate.update({
    where: { id },
    data,
    include: {
      job: { select: { id: true, title: true, department: true } },
      owner: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function getCandidateById(id: string) {
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, department: true } },
      owner: { select: { id: true, name: true, username: true } },
      interviews: {
        include: {
          interviewer: { select: { id: true, name: true, username: true } },
          evaluation: true,
        },
        orderBy: { startTime: 'desc' },
      },
      timelineEvents: {
        include: {
          operator: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      offers: {
        include: {
          job: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function getCandidateList(params: CandidateQueryParams, userId: string, userRole: string) {
  const { name, phone, email, jobId, stage, source, ownerId, page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  const jobFilter = getAccessibleJobIds(userId, userRole);

  const where: any = {
    job: jobFilter as any,
  };

  if (name) where.name = { contains: name };
  if (phone) where.phone = { contains: phone };
  if (email) where.email = { contains: email };
  if (jobId) where.jobId = jobId;
  if (stage) where.stage = stage;
  if (source) where.source = source;
  if (ownerId) where.ownerId = ownerId;

  const [list, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true, department: true } },
        owner: { select: { id: true, name: true, username: true } },
      },
    }),
    prisma.candidate.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function changeStage(candidateId: string, newStage: string, operatorId: string, description?: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) {
    throw new Error('候选人不存在');
  }

  if (isTerminalStage(candidate.stage)) {
    throw new Error('当前阶段为终态，不能继续流转');
  }

  if (!canTransition(candidate.stage, newStage)) {
    throw new Error(`非法阶段流转: ${candidate.stage} -> ${newStage}`);
  }

  return prisma.$transaction(async (tx) => {
    const updatedCandidate = await tx.candidate.update({
      where: { id: candidateId },
      data: { stage: newStage },
    });

    await tx.timelineEvent.create({
      data: {
        candidateId,
        actionType: 'STAGE_CHANGE',
        fromStage: candidate.stage,
        toStage: newStage,
        operatorId,
        description: description || `阶段变更: ${candidate.stage} -> ${newStage}`,
      },
    });

    return updatedCandidate;
  });
}