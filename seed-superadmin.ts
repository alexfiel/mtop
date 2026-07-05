import { prisma } from './lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const superadminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: {
      name: 'SUPERADMIN',
      function: 'Super Administrator',
      capability: 'ALL'
    }
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      function: 'Administrator',
      capability: 'MANAGE'
    }
  })

  const hashedPassword = await bcrypt.hash('superadmin123', 10)

  const existingSuperadmin = await prisma.user.findFirst({
    where: { email: 'superadmin@mtop.com' }
  })

  if (!existingSuperadmin) {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@mtop.com',
        roles: {
          create: {
            roleId: superadminRole.id
          }
        },
        accounts: {
          create: {
            accountId: 'superadmin@mtop.com',
            providerId: 'credential',
            password: hashedPassword
          }
        }
      }
    })
    console.log('Superadmin account created: superadmin@mtop.com / superadmin123')
  } else {
    // Make sure they have the SUPERADMIN role
    const hasRole = await prisma.userRole.findFirst({
      where: {
        userId: existingSuperadmin.id,
        roleId: superadminRole.id
      }
    });

    if (!hasRole) {
      await prisma.userRole.create({
        data: {
          userId: existingSuperadmin.id,
          roleId: superadminRole.id
        }
      });
      console.log('Granted SUPERADMIN role to existing superadmin account.')
    }
    console.log('Superadmin already exists.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
