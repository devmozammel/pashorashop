const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lp = await prisma.landingPage.findFirst({
    where: {
      slug: 'high-quality-q87-wireless-earbuds-easy-touch-control-earphones-low-latency-outdoor-wireless-headset'
    }
  });
  console.log('LP FIELDS:', {
    id: lp.id,
    title: lp.title,
    slug: lp.slug,
    heroTitle: lp.heroTitle,
    heroDescription: lp.heroDescription,
    heroImageUrl: lp.heroImageUrl,
    videoUrl: lp.videoUrl,
    featuresJson: lp.featuresJson,
    testimonialsJson: lp.testimonialsJson,
    faqsJson: lp.faqsJson,
    benefitsJson: lp.benefitsJson
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
