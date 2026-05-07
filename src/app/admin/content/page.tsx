import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJourneyScenes } from "@/lib/products";

export default async function AdminContentPage() {
  const scenes = await getJourneyScenes();

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-gold-600">Content CMS</p>
        <h1 className="font-display text-5xl text-ink">Homepage and Journey</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Journey scenes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {scenes.map((scene) => (
            <article key={scene.id} className="grid gap-4 rounded-sm border border-olive-900/10 bg-cream p-4">
              <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-white">
                {/\.(mp4|webm|mov)$/i.test(scene.imageUrl ?? "") ? (
                  <video src={scene.imageUrl ?? undefined} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <Image src={scene.imageUrl ?? "/journey/groves.svg"} alt={scene.title} fill className="object-cover" sizes="420px" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gold-600">{scene.stepLabel} · {scene.eyebrow}</p>
                <h2 className="mt-2 font-display text-2xl text-ink">{scene.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">{scene.body}</p>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Editable content endpoints</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-ink/65">
          Homepage sections can be upserted through <code>/api/admin/homepage-sections</code>. Journey scenes are seeded
          and stored in the database for future image/text editing from this panel.
        </CardContent>
      </Card>
    </section>
  );
}
