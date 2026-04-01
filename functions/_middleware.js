export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname.startsWith('/api/') || 
      url.pathname === '/pagar' || 
      url.pathname === '/verificar-stock') {
    const backendUrl = `https://mpagina.onrender.com${url.pathname}${url.search}`;
    return fetch(backendUrl, context.request);
  }
  return context.next();
}
