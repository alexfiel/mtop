import { prisma } from './lib/prisma';

async function main() {
  const accounts = await prisma.account.findMany({
    where: { providerId: 'credential' }
  });

  for (const acc of accounts) {
    if (acc.password && acc.password.startsWith('$2a$')) {
      const newHash = acc.password.replace(/^\$2a\$/, '$2b$');
      await prisma.account.update({
        where: { id: acc.id },
        data: { password: newHash }
      });
      console.log(`Updated hash for account ${acc.accountId}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
