import { prisma } from "@/lib/db";

export async function validateMemberCard(
  cardNumber: string | undefined
): Promise<boolean> {
  if (!cardNumber || cardNumber.trim() === "") return false;

  const member = await prisma.member.findUnique({
    where: { cardNumber: cardNumber.trim() },
  });

  return member !== null && member.isActive;
}
