import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase Storage deliberately forces text/plain on .html files for
// security (this is documented, intentional behavior — not a bug we can
// configure around). So instead of linking straight to the storage
// public URL, this function reads the file server-side and re-serves it
// itself with an explicit Content-Type: text/html header, which browsers
// will render normally.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const org = url.searchParams.get("org");

  if (!org) {
    return new Response("Missing 'org' parameter", { status: 400 });
  }

  const path = `${org}.html`;
  const { data, error } = await supabase.storage.from("widgets").download(path);

  if (error || !data) {
    return new Response("Widget not found", { status: 404 });
  }

  const html = await data.text();

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
});
