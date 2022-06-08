import { prisma } from "..";

export const userCategoriesSeed = async () => {
  const roles = ["USER", "USER+", "MODERATOR", "ADMIN"];

  for (const role of roles) {
    await prisma.userCategory.create({
      data: { name: role },
    });
  }
};
