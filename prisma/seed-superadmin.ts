import { prisma } from "../lib/prisma";
import { hashPassword } from "better-auth/crypto";

async function main() {
  console.log("--- Starting Super Admin & Domains Seeding ---");

  // 1. Seed Core Workflow & Departmental Domains
  const defaultDomains = [
    {
      code: "BPLO",
      name: "Business Permit and Licensing Office",
      description: "Intake, renewal assessment, business verification, and delinquent computations.",
      type: "WORKFLOW",
      allowedEmailDomain: "bplo.tagbilaran.gov.ph",
    },
    {
      code: "TRAFFIC",
      name: "City Traffic Management Office (CTMO)",
      description: "Physical inspection, roadworthiness clearance, and traffic violation verification.",
      type: "WORKFLOW",
      allowedEmailDomain: "traffic.tagbilaran.gov.ph",
    },
    {
      code: "SP",
      name: "Sangguniang Panlungsod (City Council)",
      description: "Committee review, MTOP resolution enactment, motorized tricycle certificate printing & release.",
      type: "WORKFLOW",
      allowedEmailDomain: "sp.tagbilaran.gov.ph",
    },
    {
      code: "TREASURY",
      name: "City Treasurer's Office (CTO)",
      description: "Official receipts, franchise fee collections, delinquency settlements, and payment clearance.",
      type: "WORKFLOW",
      allowedEmailDomain: "treasury.tagbilaran.gov.ph",
    },
    {
      code: "EXECUTIVE",
      name: "Office of the City Mayor & Administration",
      description: "Executive oversight, system administration, and cross-departmental operations.",
      type: "DEPARTMENT",
      allowedEmailDomain: "tagbilaran.gov.ph",
    },
    {
      code: "LEGAL",
      name: "City Legal Office",
      description: "Franchise dispute resolution, ordinance compliance, and administrative hearings.",
      type: "DEPARTMENT",
      allowedEmailDomain: "legal.tagbilaran.gov.ph",
    },
  ];

  console.log("Seeding Domains...");
  const createdDomains: Record<string, string> = {};
  for (const dom of defaultDomains) {
    const record = await prisma.domain.upsert({
      where: { code: dom.code },
      update: {
        name: dom.name,
        description: dom.description,
        type: dom.type,
        allowedEmailDomain: dom.allowedEmailDomain,
        isActive: true,
      },
      create: {
        code: dom.code,
        name: dom.name,
        description: dom.description,
        type: dom.type,
        allowedEmailDomain: dom.allowedEmailDomain,
        isActive: true,
      },
    });
    createdDomains[dom.code] = record.id;
    console.log(`  ✓ Domain [${dom.code}]: ${dom.name}`);
  }

  // 2. Seed System Roles
  const rolesToSeed = [
    { name: "SUPERADMIN", function: "Full system administration, domain management, and root access" },
    { name: "ADMIN", function: "Departmental administration, user management, and configuration" },
    { name: "SUPERVISOR", function: "Department supervisor, clearance approvals, and resolution sign-offs" },
    { name: "STAFF", function: "Desk intake, document processing, and task execution" },
    { name: "INSPECTOR", function: "Traffic physical vehicle inspection and roadworthiness testing" },
    { name: "CASHIER", function: "Treasury fee collection and official receipt issuance" },
    { name: "CLERK", function: "Clerical and records management" },
    { name: "ENFORCER", function: "Field traffic enforcement and violation citations" },
    { name: "VIEWER", function: "Read-only auditor access" },
    { name: "USER", function: "Standard portal user" },
  ];

  console.log("\nSeeding Roles...");
  const roleMap: Record<string, string> = {};
  for (const r of rolesToSeed) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { function: r.function },
      create: { name: r.name, function: r.function },
    });
    roleMap[r.name] = roleRecord.id;
    console.log(`  ✓ Role: ${r.name}`);
  }

  // 3. Create or Update Super Admin Account(s)
  const defaultPassword = "SuperAdmin123!";
  const hashedPassword = await hashPassword(defaultPassword);

  const superAdminAccounts = [
    {
      email: "superadmin@mtop.gov.ph",
      name: "System Super Admin",
      department: "EXECUTIVE",
      jobTitle: "System Administrator",
    },
    {
      email: "superadmin@mtop.com",
      name: "Super Admin",
      department: "EXECUTIVE",
      jobTitle: "Root Administrator",
    },
  ];

  console.log("\nProvisioning Super Admin Accounts...");
  for (const admin of superAdminAccounts) {
    let user = await prisma.user.findUnique({
      where: { email: admin.email },
      include: { accounts: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          emailVerified: true,
        },
        include: { accounts: true },
      });
      console.log(`  ✓ Created user: ${admin.email}`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      console.log(`  ✓ Found existing user: ${admin.email}`);
    }

    // Set or update credential account
    const existingCredAccount = user.accounts.find(
      (a) => a.providerId === "credential"
    );

    if (existingCredAccount) {
      await prisma.account.update({
        where: { id: existingCredAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
      console.log(`    ↳ Updated password for ${admin.email}`);
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
      console.log(`    ↳ Created credential account for ${admin.email}`);
    }

    // Assign SUPERADMIN and ADMIN roles
    const targetRoleIds = [roleMap["SUPERADMIN"], roleMap["ADMIN"]].filter(Boolean);
    for (const roleId of targetRoleIds) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId,
        },
      });
    }
    console.log(`    ↳ Attached SUPERADMIN & ADMIN roles to ${admin.email}`);

    // Create or update UserProfile with EXECUTIVE domain
    const execDomainId = createdDomains["EXECUTIVE"];
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        jobTitle: admin.jobTitle,
        department: admin.department,
        office: admin.department,
        domainId: execDomainId,
      },
      create: {
        userId: user.id,
        jobTitle: admin.jobTitle,
        department: admin.department,
        office: admin.department,
        domainId: execDomainId,
      },
    });
    console.log(`    ↳ Linked profile with EXECUTIVE domain`);
  }

  console.log("\n==================================================");
  console.log("SUPER ADMIN CREDENTIALS READY:");
  console.log("  Email:    superadmin@mtop.gov.ph (or superadmin@mtop.com)");
  console.log("  Password: SuperAdmin123!");
  console.log("  Roles:    SUPERADMIN, ADMIN");
  console.log("  Domain:   EXECUTIVE");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
