import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Kicker } from "@/components/ui";
import FormKabar, { type KabarAwal } from "../../FormKabar";

export default async function KabarUbahPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect("/masuk");
  const { id } = await params;

  const p = await prisma.post.findUnique({
    where: { id },
    omit: { image: true, popupImage: true },
  });
  if (!p) notFound();

  const cek = await prisma.$queryRaw<{ adaFoto: boolean; adaPopup: boolean }[]>`
    SELECT image IS NOT NULL AS "adaFoto", "popupImage" IS NOT NULL AS "adaPopup"
    FROM "Post" WHERE id = ${id}
  `;

  const awal: KabarAwal = {
    id: p.id,
    title: p.title,
    category: p.category,
    body: p.body,
    eventStartsAt: p.eventStartsAt,
    eventLocation: p.eventLocation,
    isPinned: p.isPinned,
    isPopup: p.isPopup,
    publishedAt: p.publishedAt,
    adaFoto: cek[0]?.adaFoto ?? false,
    adaPopup: cek[0]?.adaPopup ?? false,
  };

  return (
    <div className="max-w-3xl">
      <Kicker>Konten Web Warga</Kicker>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
        Ubah Kabar
      </h1>
      <FormKabar awal={awal} />
    </div>
  );
}
