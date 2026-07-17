import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const ex = await db.exam.findUnique({
    where: { id: 'cmrp5e53g005ht4642kvd34rg' },
    include: { questions: true, chapter: true }
  })
  console.log('Exam:', ex?.title)
  console.log('Questions count:', ex?.questions.length)

  const qs = await db.question.findMany({ where: { examId: 'cmrp5e53g005ht4642kvd34rg' } })
  console.log('Direct query - questions with this examId:', qs.length)

  const t = await db.topic.findFirst({ where: { slug: 'nuclear' }, include: { questions: true } })
  console.log('Topic nuclear questions:', t?.questions.length, 'examIds:', t?.questions.map(q => q.examId))
}
main().then(() => db.$disconnect())
