const PHOTO_HOSTS = new Set(['www.alamy.com', 'alamy.com', 'www.fcbarcelona.com', 'www.uefa.com', 'www.fifa.com', 'commons.wikimedia.org']);

export async function GET(request: Request) {
  try {
    const source = new URL(new URL(request.url).searchParams.get('source') || '');
    if (source.protocol !== 'https:' || source.port || source.username || source.password || !PHOTO_HOSTS.has(source.hostname)) {
      return new Response(null, { status: 400 });
    }

    const response = await fetch(source, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html') || !response.body) {
      return new Response(null, { status: 404 });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = '';
    try {
      while (html.length < 256_000 && !/<\/head>/i.test(html)) {
        const chunk = await reader.read();
        if (chunk.done) break;
        html += decoder.decode(chunk.value, { stream: true });
      }
    } finally {
      await reader.cancel();
    }
    for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
      if (!/\b(?:property|name)\s*=\s*["']og:image["']/i.test(tag)) continue;
      const value = tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2];
      if (!value) continue;
      const image = new URL(value.replace(/&amp;/g, '&'), source);
      if (image.protocol === 'https:' && !image.username && !image.password) {
        return Response.redirect(image, 302);
      }
    }
    return new Response(null, { status: 404 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
