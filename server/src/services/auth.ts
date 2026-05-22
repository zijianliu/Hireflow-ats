import prisma from '../lib/prisma';
import { generateToken, comparePassword, hashPassword } from '../lib/auth';

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new Error('用户名或密码错误');
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new Error('用户名或密码错误');
  }

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
    },
  });
}

export async function getUserList() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  });
}
