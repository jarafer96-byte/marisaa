export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Redirigir peticiones a la API al backend en Render
  if (url.pathname.startsWith('/api/') || url.pathname === '/pagar') {
    const backendUrl = `https://mpagina.onrender.com${url.pathname}${url.search}`;
    return fetch(backendUrl, context.request);
  }

  // Para el resto, continuar con el contenido estático
  return context.next();
}
