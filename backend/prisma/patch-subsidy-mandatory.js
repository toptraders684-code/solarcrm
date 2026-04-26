require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.checklistMaster.updateMany({
    where: {
      phaseName: 'Subsidy Claim',
      itemOrder: 5,
      itemText: 'Subsidy amount credited to customer bank account',
    },
    data: { isMandatory: true },
  });
  console.log(`✅ Updated ${result.count} checklist master record(s) — "Subsidy amount credited to customer bank account" is now mandatory.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
