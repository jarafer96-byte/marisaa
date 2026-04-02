export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const method = context.request.method;

  const backendRoutes = [
    '/api/',
    '/pagar',
    '/verificar-stock',
    '/login-admin',
    '/guardar-producto',
    '/eliminar-producto',
    '/subir-foto',
    '/conectar_mp',
    '/actualizar-stock-talle',
    '/guardar-talles-stock',
    '/callback_mp',
    '/purge-cache' 
  ];

  const shouldGoToBackend = backendRoutes.some(route => 
    route === path || (route.endsWith('/') && path.startsWith(route))
  );

  if (!shouldGoToBackend) {
    return context.next();
  }

  const backendUrl = `https://mpagina.onrender.com${path}${url.search}`;

  if (method === 'GET') {
    // Usar solo la URL como clave de caché (sin headers)
    const cacheKey = new Request(backendUrl);
    const cache = caches.default;

    let response = await cache.match(cacheKey);
    if (response) {
      console.log(`[Middleware] Cache hit para ${path}`);
      return response;
    }

    response = await fetch(backendUrl, context.request);

    if (response.status === 200) {
      const clonedResponse = new Response(response.body, response);
      clonedResponse.headers.set('Cache-Control', 'public, max-age=86400'); // 24h
      await cache.put(cacheKey, clonedResponse.clone());
      console.log(`[Middleware] Cache guardado para ${path} (TTL 24h)`);
      return clonedResponse;
    }
    return response;
  }

  return fetch(backendUrl, context.request);
}
