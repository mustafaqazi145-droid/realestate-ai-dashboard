// Cloudflare Pages Function — save as: functions/widget.js
// Accessible at: https://<your-project>.pages.dev/widget?org=<org-slug>
//
// This reads the widget HTML from Supabase Storage server-side (using the
// service role key, which bypasses the public-download restriction) and
// re-serves it from YOUR OWN Cloudflare domain — which does not carry
// Supabase's shared-domain HTML sandboxing restriction.

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const org = url.searchParams.get("org");

  if (!org) {
    return new Response("Missing 'org' parameter", { status: 400 });
  }

  const path = `${org}.html`;
  const storageUrl = `https://wduuigczfxotwuotafvl.supabase.co/storage/v1/object/widgets/${path}`;

  const res = await fetch(storageUrl, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!res.ok) {
    return new Response("Widget not found", { status: 404 });
  }

  const html = await res.text();

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
