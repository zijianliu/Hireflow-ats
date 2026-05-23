import prisma from '../lib/prisma';

const STAGE_TRANSITIONS: Record<string, string[]> = {
  SCREENING: ['HR_INTERVIEW', 'REJECTED'],
  HR_INTERVIEW: ['TECH_INTERVIEW', 'REJECTED'],
  TECH_INTERVIEW: ['FINAL_INTERVIEW', 'REJECTED'],
  FINAL_INTERVIEW: ['OFFER', 'REJECTED'],
  OFFER: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
};

export function canTransition(from: string, to: string): boolean {
  return STAGE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStage(stage: string): boolean {
  return stage === 'HIRED' || stage === 'REJECTED';
}

export async function createTimelineEvent(
  candidateId: string,
  actionType: string,
  operatorId: string,
  description?: string,
  fromStage?: string,
  toStage?: string
) {
  return prisma.timelineEvent.create({
    data: {
      candidateId,
      actionType,
      fromStage,
      toStage,
      operatorId,
      description,
    },
  });
}

export async function hasTimeConflict(
  interviewerId: string,
  candidateId: string,
  startTime: Date,
  endTime: Date,
  excludeInterviewId?: string
): Promise<{ hasConflict: boolean; conflictType?: string; conflictDetail?: string }> {
  const where: any = {
    status: { not: 'CANCELLED' },
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } },
    ],
  };

  if (excludeInterviewId) {
    where.NOT = { id: excludeInterviewId };
  }

  const interviewerConflict = await prisma.interview.findFirst({
    where: { ...where, interviewerId },
    include: { candidate: true },
  });

  if (interviewerConflict) {
    return {
      hasConflict: true,
      conflictType: 'interviewer',
      conflictDetail: `面试官在该时间段已有面试安排（候选人：${interviewerConflict.candidate.name}）`,
    };
  }

  const candidateConflict = await prisma.interview.findFirst({
    where: { ...where, candidateId },
    include: { interviewer: true },
  });

  if (candidateConflict) {
    return {
      hasConflict: true,
      conflictType: 'candidate',
      conflictDetail: `候选人在该时间段已有面试安排（面试官：${candidateConflict.interviewer.name}）`,
    };
  }

  return { hasConflict: false };
}

export async function canAccessJob(userId: string, userRole: string, jobId: string): Promise<boolean> {
  if (userRole === 'ADMIN') return true;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { participants: { select: { id: true } } },
  });

  if (!job) return false;

  if (userRole === 'HR') {
    return job.ownerId === userId || job.participants.some((p) => p.id === userId);
  }

  return false;
}

export async function canAccessCandidate(userId: string, userRole: string, candidateId: string): Promise<boolean> {
  if (userRole === 'ADMIN') return true;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: { include: { participants: { select: { id: true } } } },
    },
  });

  if (!candidate) return false;

  if (userRole === 'HR') {
    return candidate.job.ownerId === userId || candidate.job.participants.some((p) => p.id === userId);
  }

  if (userRole === 'INTERVIEWER') {
    const hasInterview = await prisma.interview.findFirst({
      where: {
        candidateId,
        interviewerId: userId,
      },
    });
    return !!hasInterview;
  }

  return false;
}

export function getAccessibleJobIds(userId: string, userRole: string): any {
  if (userRole === 'ADMIN') return {};
  if (userRole === 'HR') {
    return {
      OR: [
        { ownerId: userId },
        { participants: { some: { id: userId } } },
      ],
    };
  }
  return { id: '-1' };
}
