import prisma from '../lib/prisma';
import { getAccessibleJobIds } from './common';

export interface CreateJobData {
  title: string;
  department: string;
  location: string;
  headcount: number;
  description: string;
  ownerId: string;
  participantIds?: string[];
}

export interface UpdateJobData {
  title?: string;
  department?: string;
  location?: string;
  headcount?: number;
  description?: string;
  participantIds?: string[];
}

export interface JobQueryParams {
  title?: string;
  department?: string;
  location?: string;
  status?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
}

export async function createJob(data: CreateJobData) {
  if (data.headcount <= 0) {
    throw new Error('招聘人数必须大于0');
  }

  return prisma.job.create({
    data: {
      title: data.title,
      department: data.department,
      location: data.location,
      headcount: data.headcount,
      description: data.description,
      ownerId: data.ownerId,
      participants: data.participantIds
        ? { connect: data.participantIds.map((id) => ({ id })) }
        : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, username: true } },
      participants: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function updateJob(id: string, data: UpdateJobData) {
  const { participantIds, ...rest } = data;

  if (rest.headcount !== undefined && rest.headcount <= 0) {
    throw new Error('招聘人数必须大于0');
  }

  return prisma.job.update({
    where: { id },
    data: {
      ...rest,
      participants: participantIds
        ? { set: participantIds.map((id) => ({ id })) }
        : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, username: true } },
      participants: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function closeJob(id: string) {
  return prisma.job.update({
    where: { id },
    data: { status: 'CLOSED' },
  });
}

export async function reopenJob(id: string) {
  return prisma.job.update({
    where: { id },
    data: { status: 'RECRUITING' },
  });
}

export async function pauseJob(id: string) {
  return prisma.job.update({
    where: { id },
    data: { status: 'PAUSED' },
  });
}

export async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, username: true } },
      participants: { select: { id: true, name: true, username: true } },
      _count: { select: { candidates: true } },
    },
  });
}

export async function getJobList(params: JobQueryParams, userId: string, userRole: string) {
  const { title, department, location, status, ownerId, page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {
    ...getAccessibleJobIds(userId, userRole),
  };

  if (title) where.title = { contains: title };
  if (department) where.department = { contains: department };
  if (location) where.location = { contains: location };
  if (status) where.status = status;
  if (ownerId) where.ownerId = ownerId;

  const [list, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, username: true } },
        participants: { select: { id: true, name: true, username: true } },
        _count: { select: { candidates: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return { list, total, page, pageSize };
}