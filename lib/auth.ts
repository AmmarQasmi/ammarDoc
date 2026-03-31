// Mock authentication for demo purposes
// In production, use real auth (NextAuth, Clerk, Auth0, etc.)
import { prisma } from "@/lib/prisma";

export const SEEDED_USERS = [
  {
    email: "owner@ajaia.local",
    name: "Owner User",
  },
  {
    email: "editor@ajaia.local",
    name: "Editor User",
  },
];

export async function getCurrentUserId(request?: Request): Promise<string> {
  // Demo user selection via request header. Falls back to owner user.
  const requestedEmail = request?.headers.get("x-demo-user-email") || SEEDED_USERS[0].email;

  const currentUser = await prisma.user.findUnique({
    where: { email: requestedEmail },
    select: { id: true },
  });

  if (currentUser) {
    return currentUser.id;
  }

  const fallbackUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!fallbackUser) {
    throw new Error("No users found in database. Run npm run prisma:seed first.");
  }

  return fallbackUser.id;
}

export function getCurrentUser(email: string) {
  return SEEDED_USERS.find((u) => u.email === email) || SEEDED_USERS[0];
}

export function getAllUsers() {
  return SEEDED_USERS;
}
