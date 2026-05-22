import prisma from '../lib/prisma';
import {
  JobStatus,
  CandidateStage,
  CandidateSource,
  InterviewRound,
  InterviewMethod,
  InterviewStatus,
  OfferStatus,
  ActionType,
  Role
} from '@prisma/client';

const STAGE_TRANSITIONS: Record<CandidateStage, CandidateStage[]> = {
  SCREENING: [CandidateStage.HR_INTERVIEW, CandidateStage.REJECTED],
  HR_INTERVIEW: [CandidateStage.TECH_INTERVIEW, CandidateStage.REJECTED],
  TECH_INTERVIEW: [CandidateStage.FINAL_INTERVIEW, CandidateStage.REJECTED],
  FINAL_INTERVIEW: [CandidateStage.OFFER, CandidateStage.REJECTED],
  OFFER: [CandidateStage.HIRED, CandidateStage.REJECTED],
  HIRED: [],
  REJECTED: [],
};

export function canTransition(from: CandidateStage, to: CandidateStage): boolean {
  return STAGE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStage(stage: CandidateStage): boolean {
  return stage === CandidateStage.HIRED || stage === CandidateStage.REJECTED;
}

export async function createTimelineEvent(
  candidateId: string,
  actionType: ActionType,
  operatorId: string,
  description?: string,
  fromStage?: CandidateStage,
  toStage?: CandidateStage
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
    status: { not: InterviewStatus.CANCELLED },
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

export async function canAccessJob(userId: string, userRole: Role, jobId: string): Promise<boolean> {
  if (userRole === Role.ADMIN) return true;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { participants: { select: { id: true } } },
  });

  if (!job) return false;

  if (userRole === Role.HR) {
    return job.ownerId === userId || job.participants.some((p) => p.id === userId);
  }

  return false;
}

export async function canAccessCandidate(userId: string, userRole: Role, candidateId: string): Promise<boolean> {
  if (userRole === Role.ADMIN) return true;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: { include: { participants: { select: { id: true } } } },
    },
  });

  if (!candidate) return false;

  if (userRole === Role.HR) {
    return candidate.job.ownerId === userId || candidate.job.participants.some((p) => p.id === userId);
  }

  if (userRole === Role.INTERVIEWER) {
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

export function getAccessibleJobIds(userId: string, userRole: Role): { ownerId?: string; participants?: { some: { id: string } } } | {} {
  if (userRole === Role.ADMIN) return {};
  if (userRole === Role.HR) {
    return {
      OR: [
        { ownerId: userId },
        { participants: { some: { id: userId } } },
      ],
    };
  }
  return { id: '-1' };
}
