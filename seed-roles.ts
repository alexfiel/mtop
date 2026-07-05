import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

async function main() {
  const { prisma } = await import('./lib/prisma');
  const roles = [
    { name: 'ADMIN', function: 'System Administrator', capability: 'ALL' },
    { name: 'SECRETARY', function: 'Secretary', capability: 'MANAGE_FRANCHISE' },
    { name: 'ENFORCER', function: 'Traffic Enforcer', capability: 'VIEW_FRANCHISE' },
    { name: 'INSPECTOR', function: 'Inspector', capability: 'INSPECT_TRICYCLE' },
    { name: 'CLERK', function: 'Clerk', capability: 'PROCESS_APPLICATION' },
    { name: 'CASHIER', function: 'Cashier', capability: 'PROCESS_PAYMENT' },
    { name: 'VIEWER', function: 'Viewer', capability: 'READ_ONLY' },
    { name: 'USER', function: 'Standard User', capability: 'BASIC' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('Roles seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
