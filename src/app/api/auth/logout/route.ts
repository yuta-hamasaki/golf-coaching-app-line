import { createLogoutResponse } from "@/lib/auth-response";

export async function POST() {
  return createLogoutResponse();
}
