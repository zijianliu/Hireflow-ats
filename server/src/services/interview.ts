import prisma from '../lib/prisma';
import { InterviewRound, InterviewMethod, InterviewStatus, Role, ActionType } from '@prisma/client';
import { hasTimeConflict, createTimelineEvent, getAccessibleJobIds } from './common';

export interface CreateInterviewData {
  candidateId: string;
  jobId: string;
  round: InterviewRound;
  interviewerId: string;
  startTime: Date;
  endTime: Date;
  method: InterviewMethod;
  location?: string;
}

export interface UpdateInterviewData {
  round?: InterviewRound;
  interviewerId?: string;
  startTime?: Date;
  endTime?: Date;
  method?: InterviewMethod;
  location?: string;
}

export interface InterviewQueryParams {
  interviewerId?: string;
  candidateId?: string;
  jobId?: string;
  status?: InterviewStatus;
  startTimeFrom?: Date;
  startTimeTo?: Date;
  page?: number;
  pageSize?: number;
}

export async function createInterview(data: CreateInterviewData, operatorId: string) {
  if (data.startTime >= data.endTime) {
    throw new Error('面试开始时间必须早于结束时间');
  }

  const conflict = await hasTimeConflict(
    data.interviewerId,
    data.candidateId,
    new Date(data.startTime),
    new Date(data.endTime)
  );

  if (conflict.hasConflict) {
    throw new Error(conflict.conflictDetail || '时间冲突');
  }

  return prisma.$transaction(async (tx) => {
    const interview = await tx.interview.create({
      data: {
        candidateId: data.candidateId,
        jobId: data.jobId,
        round: data.round,
        interviewerId: data.interviewerId,
        startTime: data.startTime,
        endTime: data.endTime,
        method: data.method,
        location: data.location,
      },
      include: {
        candidate: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
        interviewer: { select: { id: true, name: true, username: true } },
      },
    });

    await tx.timelineEvent.create({
      data: {
        candidateId: data.candidateId,
        actionType: ActionType.INTERVIEW_SCHEDULED,
        operatorId,
        description: `安排面试: ${data.round} - 面试官: ${interview.interviewer.name} - 时间: ${data.startTime.toLocaleString()}`,
      },
    });

    return interview;
  });
}

export async function updateInterview(id: string, data: UpdateInterviewData) {
  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) {
    throw new Error('面试不存在');
  }

  const startTime = data.startTime || interview.startTime;
  const endTime = data.endTime || interview.endTime;

  if (startTime >= endTime) {
    throw new Error('面试开始时间必须早于结束时间');
  }

  const conflict = await hasTimeConflict(
    data.interviewerId || interview.interviewerId,
    interview.candidateId,
    new Date(startTime),
    new Date(endTime),
    id
  );

  if (conflict.hasConflict) {
    throw new Error(conflict.conflictDetail || '时间冲突');
  }

  return prisma.interview.update({
    where: { id },
    data,
    include: {
      candidate: { select: { id: true, name: true } },
      job: { select: { id: true, title: true } },
      interviewer: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function cancelInterview(id: string, operatorId: string) {
  return prisma.$transaction(async (tx) => {
    const interview = await tx.interview.update({
      where: { id },
      data: { status: InterviewStatus.CANCELLED },
      include: { candidate: { select: { id: true, name: true } } },
    });

    await tx.timelineEvent.create({
      data: {
        candidateId: interview.candidateId,
        actionType: ActionType.INTERVIEW_CANCELLED,
        operatorId,
        description: `取消面试: ${interview.round}`,
      },
    });

    return interview;
  });
}

export async function getInterviewById(id: string) {
  return prisma.interview.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, phone: true, email: true } },
      job: { select: { id: true, title: true, department: true } },
      interviewer: { select: { id: true, name: true, username: true } },
      evaluation: true,
    },
  });
}

export async function getInterviewList(params: InterviewQueryParams, userId: string, userRole: Role) {
  const { interviewerId, candidateId, jobId, status, startTimeFrom, startTimeTo, page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (userRole === Role.INTERVIEWER) {
    where.interviewerId = userId;
  } else if (userRole === Role.HR) {
    const jobFilter = getAccessibleJobIds(userId, userRole);
    where.job = jobFilter as any;
  }

  if (interviewerId) where.interviewerId = interviewerId;
  if (candidateId) where.candidateId = candidateId;
  if (jobId) where.jobId = jobId;
  if (status) where.status = status;
  if (startTimeFrom || startTimeTo) {
    where.startTime = {};
    if (startTimeFrom) where.startTime.gte = new Date(startTimeFrom);
    if (startTimeTo) where.startTime.lte = new Date(startTimeTo);
  }

  const [list, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { startTime: 'desc' },
      include: {
        candidate: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
        interviewer: { select: { id: true, name: true, username: true } },
        evaluation: true,
      },
    }),
    prisma.interview.count({ where }),
  ]);

  return { list, total, page, pageSize };
}
