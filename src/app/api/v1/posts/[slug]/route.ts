// GET /api/v1/posts/[slug] — detail satu kabar + kabar terkait.
import { prisma } from "@/lib/db";
import { j, ringkasKabar } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: true },
  });
  if (!post || !post.publishedAt || post.publishedAt > new Date()) {
    return j({ message: "Kabar tidak ditemukan." }, 404);
  }

  const related = await prisma.post.findMany({
    where: {
      id: { not: post.id },
      category: post.category,
      publishedAt: { not: null, lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return j({
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category,
    body: post.body,
    published_at: post.publishedAt.toISOString(),
    image_url: post.image ? `/api/gambar/kabar/${post.id}` : null,
    is_pinned: post.isPinned,
    event_starts_at: post.eventStartsAt ? post.eventStartsAt.toISOString() : null,
    event_location: post.eventLocation,
    author_name: post.author?.name ?? null,
    related: related.map(ringkasKabar),
  });
}
