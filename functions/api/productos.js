export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  const isStatic = () => {
    const staticExtensions = /\.(css|js|webp|png|jpg|jpeg|ico|txt|html|json|svg|woff2?)$/i;
    return staticExtensions.test(path) || path.startsWith('/static/');
  };

  if (method === 'GET' && path === '/api/productos') {
    if (request.headers.get('X-Purge-Cache') === 'true') {
      const expectedToken = env.PURGE_SECRET;
      const receivedToken = request.headers.get('X-Purge-Token');
      if (!expectedToken || receivedToken !== expectedToken) {
        return new Response('Unauthorized', { status: 403 });
      }
      const vendorEmail = request.headers.get('X-Vendor-Email') || 'default';
      const cacheUrl = new URL(url);
      cacheUrl.searchParams.delete('_');
      cacheUrl.searchParams.set('vendor', vendorEmail);
      const cacheKey = new Request(cacheUrl.toString());
      const cache = caches.default;
      await cache.delete(cacheKey);
      return new Response('Cache purged', { status: 200 });
    }

    if (request.headers.has('Authorization')) {
      const backendUrl = env.API_BACKEND_URL || 'https://mpagina.onrender.com';
      return fetch(`${backendUrl}${path}${url.search}`, request);
    }

    const vendorEmail = request.headers.get('X-Vendor-Email');
    if (!vendorEmail) {
      const backendUrl = env.API_BACKEND_URL || 'https://mpagina.onrender.com';
      return fetch(`${backendUrl}${path}${url.search}`, request);
    }

    const cacheUrl = new URL(url);
    cacheUrl.searchParams.delete('_');
    cacheUrl.searchParams.set('vendor', vendorEmail);
    const cacheKey = new Request(cacheUrl.toString());
    const cache = caches.default;

    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Cache-Worker', 'HIT');
      return response;
    }

    const backendUrl = env.API_BACKEND_URL || 'https://mpagina.onrender.com';
    const backendResponse = await fetch(`${backendUrl}${path}${url.search}`, request);
    if (!backendResponse.ok) return backendResponse;

    const cleanHeaders = new Headers(backendResponse.headers);
    cleanHeaders.delete('set-cookie');
    cleanHeaders.set('vary', 'Accept-Encoding');

    const responseToCache = new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: cleanHeaders,
    });
    responseToCache.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    responseToCache.headers.set('Cache-Tag', `vendor-${vendorEmail}`);
    responseToCache.headers.set('X-Cache-Worker', 'MISS');

    context.waitUntil(cache.put(cacheKey, responseToCache.clone()));

    const clientResponse = new Response(responseToCache.body, responseToCache);
    clientResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    clientResponse.headers.set('Pragma', 'no-cache');
    clientResponse.headers.set('Expires', '0');
    return clientResponse;
  }

  if (method === 'GET' && path === '/api/todos-productos') {
    if (request.headers.get('X-Purge-Global-Cache') === 'true') {
      const expectedToken = env.PURGE_SECRET;
      const receivedToken = request.headers.get('X-Purge-Token');
      if (!expectedToken || receivedToken !== expectedToken) {
        return new Response('Unauthorized', { status: 403 });
      }
      const cacheKey = new Request(new URL('/api/todos-productos?global=1', url.origin));
      const cache = caches.default;
      await cache.delete(cacheKey);
      return new Response('Global cache purged', { status: 200 });
    }

    const cacheKey = new Request(new URL('/api/todos-productos?global=1', url.origin));
    const cache = caches.default;

    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Cache-Worker', 'HIT');
      return response;
    }

    const backendUrl = env.API_BACKEND_URL || 'https://mpagina.onrender.com';
    const backendResponse = await fetch(`${backendUrl}${path}${url.search}`, request);
    if (!backendResponse.ok) return backendResponse;

    const cleanHeaders = new Headers(backendResponse.headers);
    cleanHeaders.delete('set-cookie');
    cleanHeaders.set('vary', 'Accept-Encoding');

    const responseToCache = new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: cleanHeaders,
    });
    responseToCache.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    responseToCache.headers.set('Cache-Tag', 'global-feed');
    responseToCache.headers.set('X-Cache-Worker', 'MISS');

    context.waitUntil(cache.put(cacheKey, responseToCache.clone()));

    const clientResponse = new Response(responseToCache.body, responseToCache);
    clientResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    clientResponse.headers.set('Pragma', 'no-cache');
    clientResponse.headers.set('Expires', '0');
    return clientResponse;
  }

  if (isStatic()) {
    return context.next();
  }

  const backendUrl = env.API_BACKEND_URL || 'https://mpagina.onrender.com';
  const proxyUrl = `${backendUrl}${path}${url.search}`;
  const proxyRequest = new Request(proxyUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });
  return fetch(proxyRequest);
}
