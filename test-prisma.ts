import { prisma } from "./lib/prisma";
console.log("Prisma keys:", Object.keys(prisma));
console.log("itemAccounts:", !!prisma.itemAccounts);
