import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const ex = await db.exam.findFirst({
    include: { questions: true, chapter: true }
  })
  console.log('Exam:', ex?.title)
  console.log('Questions count:', ex?.questions.length)
}
main().then(() => db.$disconnect())
