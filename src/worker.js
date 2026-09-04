// Cloudflare Worker entry point.
//
// Handles two things:
//   1. /widget?org=<slug>  -> reads the widget HTML from Supabase Storage
//      (server-side, so Supabase's "force text/plain on .html" restriction
//      doesn't apply) and re-serves it with a real text/html header.
//   2. Everything else -> falls through to the built static site (your
//      admin dashboard), same as before.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/widget") {
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

    // Not a widget request — serve the built dashboard site as before.
    return env.ASSETS.fetch(request);
  },
};
