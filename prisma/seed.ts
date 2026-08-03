import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@allcepts.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Usuario admin ja existe.');
    return;
  }
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { name: 'Administrador', email, password: hashedPassword, role: 'ADMIN' },
  });
  console.log('Usuario admin criado:', email);
}

main().finally(() => prisma.$disconnect());
