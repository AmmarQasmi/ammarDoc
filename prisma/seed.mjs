import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const userA = await prisma.user.upsert({
    where: { email: "owner@ajaia.local" },
    update: {
      passwordHash,
    },
    create: {
      email: "owner@ajaia.local",
      name: "Owner User",
      passwordHash,
    }
  });

  const userB = await prisma.user.upsert({
    where: { email: "editor@ajaia.local" },
    update: {
      passwordHash,
    },
    create: {
      email: "editor@ajaia.local",
      name: "Editor User",
      passwordHash,
    }
  });

  const doc = await prisma.document.upsert({
    where: { id: "seed-doc-1" },
    update: {},
    create: {
      id: "seed-doc-1",
      ownerUserId: userA.id,
      title: "Seeded Demo Document",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is a seeded document." }]
          }
        ]
      }
    }
  });

  await prisma.documentAccess.upsert({
    where: {
      documentId_userId: {
        documentId: doc.id,
        userId: userB.id
      }
    },
    update: {
      accessRole: "EDITOR"
    },
    create: {
      documentId: doc.id,
      userId: userB.id,
      accessRole: "EDITOR",
      grantedByUserId: userA.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
