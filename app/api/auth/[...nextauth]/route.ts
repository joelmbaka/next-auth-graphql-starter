import { auth } from "@/auth";
import { authOptions } from "@/auth";

// Export the NextAuth handler for all auth routes
const handler = auth(authOptions);

export { handler as GET, handler as POST };