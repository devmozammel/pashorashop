const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.siteSetting.findMany();
    console.log("All settings keys and values:");
    console.log(settings);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
