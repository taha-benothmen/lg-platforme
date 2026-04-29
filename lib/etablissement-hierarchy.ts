import { prisma } from "@/lib/prisma"

/** Direct and nested children (sous-établissements) of a parent establishment. */
export async function getAllChildEstablishmentIds(parentId: string): Promise<string[]> {
  const children = await prisma.etablissement.findMany({
    where: { parentId },
    select: { id: true },
  })

  let allIds = children.map((c) => c.id)

  for (const child of children) {
    const nested = await getAllChildEstablishmentIds(child.id)
    allIds = [...allIds, ...nested]
  }

  return allIds
}
