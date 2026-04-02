export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const method = context.request.method;

  // Rutas que deben ir al backend de Render
  const backendRoutes = [
    '/api/',               // todas las rutas /api/*
    '/pagar',
    '/verificar-stock',
    '/login-admin',
    '/guardar-producto',
    '/eliminar-producto',
    '/subir-foto',
    '/conectar_mp',
    '/actualizar-stock-talle',
    '/guardar-talles-stock',
    '/callback_mp'
  ];

  // Verificar si la ruta actual debe ir al backend
  const shouldGoToBackend = backendRoutes.some(route => 
    route === path || (route.endsWith('/') && path.startsWith(route))
  );

  if (!shouldGoToBackend) {
    // Contenido estático (HTML, CSS, JS, imágenes)
    return context.next();
  }

  // --- A partir de aquí, todas las peticiones van al backend ---
  const backendUrl = `https://mpagina.onrender.com${path}${url.search}`;

  // Solo cachear peticiones GET
  if (method === 'GET') {
    const cacheKey = new Request(backendUrl, context.request);
    const cache = caches.default;

    // Intentar obtener respuesta desde caché
    let response = await cache.match(cacheKey);
    if (response) {
      console.log(`[Middleware] Cache hit para ${path}`);
      return response;
    }

    // No estaba en caché, ir al backend
    response = await fetch(backendUrl, context.request);

    // Si la respuesta es exitosa, guardarla en caché con TTL
    if (response.status === 200) {
      const clonedResponse = new Response(response.body, response);
      // Establecer TTL (ejemplo: 300 segundos = 5 minutos)
      clonedResponse.headers.set('Cache-Control', 'public, max-age=86400');
      await cache.put(cacheKey, clonedResponse.clone());
      console.log(`[Middleware] Cache guardado para ${path} (TTL 300s)`);
      return clonedResponse;
    }
    return response;
  }

  // Para métodos no-GET (POST, PUT, DELETE, etc.), no cachear
  return fetch(backendUrl, context.request);
}
