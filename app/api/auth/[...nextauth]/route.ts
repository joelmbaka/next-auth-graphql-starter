import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
}