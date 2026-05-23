import { PrismaClient } from '@prisma/client';
import { hashPassword } from './lib/auth';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hashPassword('123456');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hireflow.com',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      phone: '13800000000',
    },
  });

  const hr1 = await prisma.user.upsert({
    where: { username: 'hr001' },
    update: {},
    create: {
      username: 'hr001',
      email: 'hr001@hireflow.com',
      password: hashedPassword,
      name: '张HR',
      role: 'HR',
      phone: '13800000001',
    },
  });

  const hr2 = await prisma.user.upsert({
    where: { username: 'hr002' },
    update: {},
    create: {
      username: 'hr002',
      email: 'hr002@hireflow.com',
      password: hashedPassword,
      name: '李HR',
      role: 'HR',
      phone: '13800000002',
    },
  });

  const interviewer1 = await prisma.user.upsert({
    where: { username: 'tech001' },
    update: {},
    create: {
      username: 'tech001',
      email: 'tech001@hireflow.com',
      password: hashedPassword,
      name: '王技术',
      role: 'INTERVIEWER',
      phone: '13800000003',
    },
  });

  const interviewer2 = await prisma.user.upsert({
    where: { username: 'tech002' },
    update: {},
    create: {
      username: 'tech002',
      email: 'tech002@hireflow.com',
      password: hashedPassword,
      name: '赵技术',
      role: 'INTERVIEWER',
      phone: '13800000004',
    },
  });

  const job1 = await prisma.job.upsert({
    where: { id: 'job-fe-001' },
    update: {},
    create: {
      id: 'job-fe-001',
      title: '高级前端工程师',
      department: '技术部',
      location: '北京',
      headcount: 3,
      status: 'RECRUITING',
      description: '负责公司核心产品的前端开发工作，要求3年以上React经验。',
      ownerId: hr1.id,
      participants: {
        connect: [{ id: interviewer1.id }, { id: interviewer2.id }],
      },
    },
  });

  const job2 = await prisma.job.upsert({
    where: { id: 'job-be-001' },
    update: {},
    create: {
      id: 'job-be-001',
      title: '后端开发工程师',
      department: '技术部',
      location: '上海',
      headcount: 2,
      status: 'RECRUITING',
      description: '负责公司后端服务开发，熟悉Node.js或Java。',
      ownerId: hr2.id,
    },
  });

  const job3 = await prisma.job.upsert({
    where: { id: 'job-closed-001' },
    update: {},
    create: {
      id: 'job-closed-001',
      title: '测试工程师（已关闭）',
      department: '质量部',
      location: '深圳',
      headcount: 1,
      status: 'CLOSED',
      description: '该职位已关闭。',
      ownerId: hr1.id,
    },
  });

  const candidate1 = await prisma.candidate.upsert({
    where: { id: 'cand-001' },
    update: {},
    create: {
      id: 'cand-001',
      name: '候选人张三',
      phone: '13900000001',
      email: 'zhangsan@example.com',
      resumeUrl: 'https://example.com/resume/zhangsan.pdf',
      source: 'PLATFORM',
      jobId: job1.id,
      stage: 'SCREENING',
      ownerId: hr1.id,
      remark: '5年前端经验，React技术栈熟练。',
    },
  });

  const candidate2 = await prisma.candidate.upsert({
    where: { id: 'cand-002' },
    update: {},
    create: {
      id: 'cand-002',
      name: '候选人李四',
      phone: '13900000002',
      email: 'lisi@example.com',
      resumeUrl: 'https://example.com/resume/lisi.pdf',
      source: 'REFERRAL',
      jobId: job1.id,
      stage: 'TECH_INTERVIEW',
      ownerId: hr1.id,
      remark: '3年经验，能力不错。',
    },
  });

  console.log('Seed data created successfully!');
  console.log('Admin: admin / 123456');
  console.log('HR: hr001 / 123456, hr002 / 123456');
  console.log('Interviewer: tech001 / 123456, tech002 / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
