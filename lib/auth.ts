import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
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
      isActive: {
        type: "boolean",
        defaultValue: true,
        required: false,
        returned: true,
        input: false,
      },
      disabledAt: {
        type: "date",
        required: false,
        returned: true,
        input: false,
      },
      disabledReason: {
        type: "string",
        required: false,
        returned: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
          });
          if (user && (user as any).isActive === false) {
            throw new APIError("FORBIDDEN", {
              message: "Your account has been disabled by the Super Admin. Please contact the administrator for assistance.",
            });
          }
        },
      },
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
