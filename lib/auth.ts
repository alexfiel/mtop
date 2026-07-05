import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendPasswordResetEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  trustedOrigins: ["http://localhost:3000"],
  user: {
    additionalFields: {
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // The DB session is valid for 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  advanced: {
    defaultCookieAttributes: {
      maxAge: undefined,
    },
  },
});
