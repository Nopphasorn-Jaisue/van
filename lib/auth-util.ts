import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { Prisma } from "@prisma/client";

const secretKey = process.env.JWT_SECRET || "fallback-secret-key-van-booking-up-2026-secure-32chars";
const JWT_SECRET = new TextEncoder().encode(secretKey);

export type AuthUserType = Prisma.UserGetPayload<{ include: { faculty: true } }>;

export async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUserType | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return payload as unknown as AuthUserType;
      }
    }
  } catch {
    // Ignore error
  }
  
  return null;
}
