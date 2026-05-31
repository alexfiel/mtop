import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendVerificationEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Prevents login until verified
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  trustedOrigins: ["http://localhost:3000"],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // The DB session is valid for 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  advanced: {
    defaultCookieAttributes: {
      // By setting maxAge to null, the browser will treat it as a session cookie
      // which means it will be cleared when the browser window is closed.
      maxAge: undefined,
    },
  },
});
