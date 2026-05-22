import prisma from '../lib/prisma';
import { JobStatus, CandidateStage, Role } from '@prisma/client';
import { getAccessibleJobIds } from './common';

export interface DashboardQueryParams {
  jobId?: string;
  department?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function getDashboardStats(params: DashboardQueryParams, userId: string, userRole: Role) {
  const { jobId, department, startDate, endDate } = params;

  const jobFilter = getAccessibleJobIds(userId, userRole);

  const jobWhere: any = { ...jobFilter };
  if (jobId) jobWhere.id = jobId;
  if (department) jobWhere.department = { contains: department };

  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const [
    recruitingJobCount,
    newCandidateCount,
    pendingInterviewCount,
    completedInterviewCount,
    offerCount,
    hiredCount,
    rejectedCount,
    stageDistribution,
    sourcePassRate,
  ] = await Promise.all([
    prisma.job.count({
      where: { ...jobWhere, status: JobStatus.RECRUITING },
    }),

    prisma.candidate.count({
      where: {
        job: jobWhere as any,
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
    }),

    prisma.interview.count({
      where: {
        job: jobWhere as any,
        status: 'PENDING',
        startTime: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
    }),

    prisma.interview.count({
      where: {
        job: jobWhere as any,
        status: 'COMPLETED',
        startTime: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
    }),

    prisma.offer.count({
      where: {
        job: jobWhere as any,
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
    }),

    prisma.candidate.count({
      where: {
        job: jobWhere as any,
        stage: CandidateStage.HIRED,
      },
    }),

    prisma.candidate.count({
      where: {
        job: jobWhere as any,
        stage: CandidateStage.REJECTED,
      },
    }),

    prisma.candidate.groupBy({
      by: ['stage'],
      where: { job: jobWhere as any },
      _count: { stage: true },
    }),

    getSourcePassRate(jobWhere, startDate, endDate),
  ]);

  return {
    recruitingJobCount,
    newCandidateCount,
    pendingInterviewCount,
    completedInterviewCount,
    offerCount,
    hiredCount,
    rejectedCount,
    stageDistribution: stageDistribution.map((item) => ({
      stage: item.stage,
      count: item._count.stage,
    })),
    sourcePassRate,
  };
}

async function getSourcePassRate(jobWhere: any, startDate?: Date, endDate?: Date) {
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const candidates = await prisma.candidate.findMany({
    where: {
      job: jobWhere as any,
      createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
    },
    select: {
      source: true,
      stage: true,
    },
  });

  const sourceStats: Record<string, { total: number; passed: number }> = {};

  candidates.forEach((c) => {
    if (!sourceStats[c.source]) {
      sourceStats[c.source] = { total: 0, passed: 0 };
    }
    sourceStats[c.source].total++;
    if (c.stage === CandidateStage.HIRED || c.stage === CandidateStage.OFFER) {
      sourceStats[c.source].passed++;
    }
  });

  return Object.entries(sourceStats).map(([source, stats]) => ({
    source,
    total: stats.total,
    passed: stats.passed,
    passRate: stats.total > 0 ? Number(((stats.passed / stats.total) * 100).toFixed(2)) : 0,
  }));
}
