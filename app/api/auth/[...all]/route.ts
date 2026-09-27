import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Multi-departmental MTOP authentication route handler with access controls
export const { GET, POST } = toNextJsHandler(auth);

