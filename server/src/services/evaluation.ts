import prisma from '../lib/prisma';

export interface CreateEvaluationData {
  interviewId: string;
  score: number;
  strengths: string;
  concerns: string;
  passed: boolean;
  remark?: string;
}

export async function createEvaluation(data: CreateEvaluationData, evaluatorId: string) {
  if (data.score < 1 || data.score > 5) {
    throw new Error('评分范围为1到5分');
  }

  if (data.passed === undefined || data.passed === null) {
    throw new Error('是否通过为必填项');
  }

  const interview = await prisma.interview.findUnique({
    where: { id: data.interviewId },
    include: { evaluation: true },
  });

  if (!interview) {
    throw new Error('面试不存在');
  }

  if (interview.interviewerId !== evaluatorId) {
    throw new Error('非当前面试官不能提交该面试评价');
  }

  if (interview.evaluation) {
    throw new Error('同一场面试不能重复提交评价');
  }

  if (interview.status === 'CANCELLED') {
    throw new Error('已取消的面试不能提交评价');
  }

  return prisma.$transaction(async (tx) => {
    const evaluation = await tx.interviewEvaluation.create({
      data: {
        interviewId: data.interviewId,
        candidateId: interview.candidateId,
        score: data.score,
        strengths: data.strengths,
        concerns: data.concerns,
        passed: data.passed,
        remark: data.remark,
      },
    });

    await tx.interview.update({
      where: { id: data.interviewId },
      data: { status: 'COMPLETED' },
    });

    await tx.timelineEvent.create({
      data: {
        candidateId: interview.candidateId,
        actionType: 'INTERVIEW_EVALUATED',
        operatorId: evaluatorId,
        description: `面试评价: ${interview.round} - 评分: ${data.score} - ${data.passed ? '通过' : '不通过'}`,
      },
    });

    return evaluation;
  });
}

export async function getEvaluationByInterviewId(interviewId: string, userId: string, userRole: string) {
  const evaluation = await prisma.interviewEvaluation.findUnique({
    where: { interviewId },
    include: {
      interview: {
        include: {
          interviewer: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });

  if (!evaluation) return null;

  if (userRole === 'INTERVIEWER' && evaluation.interview.interviewerId !== userId) {
    throw new Error('权限不足');
  }

  return evaluation;
}

export async function getEvaluationsByCandidateId(candidateId: string, userId: string, userRole: string) {
  if (userRole === 'INTERVIEWER') {
    return prisma.interviewEvaluation.findMany({
      where: {
        candidateId,
        interview: { interviewerId: userId },
      },
      include: {
        interview: {
          include: {
            interviewer: { select: { id: true, name: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return prisma.interviewEvaluation.findMany({
    where: { candidateId },
    include: {
      interview: {
        include: {
          interviewer: { select: { id: true, name: true, username: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}