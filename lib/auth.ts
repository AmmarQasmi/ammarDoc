// Mock authentication for demo purposes
// In production, use real auth (NextAuth, Clerk, Auth0, etc.)

export const SEEDED_USERS = [
  {
    id: "user-1",
    email: "owner@ajaia.local",
    name: "Owner User",
  },
  {
    id: "user-2",
    email: "editor@ajaia.local",
    name: "Editor User",
  },
];

export function getCurrentUserId(): string {
  // For demo: check cookies or default to first user
  return "user-1";
}

export function getCurrentUser(userId: string) {
  return SEEDED_USERS.find((u) => u.id === userId) || SEEDED_USERS[0];
}

export function getAllUsers() {
  return SEEDED_USERS;
}
