import { prisma } from './lib/prisma';
import { auth } from './lib/auth';

async function main() {
  const email = 'superadmin@mtop.com';
  
  // 1. Delete existing user if it exists
  await prisma.user.deleteMany({
    where: { email }
  });
  console.log('Deleted existing superadmin user if any.');

  // 2. Ensure SUPERADMIN role exists
  const superadminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: {
      name: 'SUPERADMIN',
      function: 'Super Administrator',
      capability: 'ALL'
    }
  });

  // 3. Create using better-auth to ensure correct password hashing
  const signUpResult = await auth.api.signUpEmail({
    body: {
      name: 'Super Admin',
      email: email,
      password: 'superadmin123'
    },
    headers: new Headers()
  });

  if (signUpResult.user) {
    // 4. Assign role
    await prisma.userRole.create({
      data: {
        userId: signUpResult.user.id,
        roleId: superadminRole.id
      }
    });
    console.log('Superadmin created via better-auth successfully: superadmin@mtop.com / superadmin123');
  } else {
    console.error('Failed to create superadmin:', signUpResult);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
