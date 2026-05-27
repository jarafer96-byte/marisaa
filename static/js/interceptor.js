(function() {
  const API_BASE = 'https://mpagina.onrender.com';
  const backendRoutes = [
    '/api/', '/pagar', '/verificar-stock', '/login-admin',
    '/guardar-producto', '/eliminar-producto', '/subir-foto',
    '/conectar_mp', '/actualizar-stock-talle', '/guardar-talles-stock',
    '/callback_mp',
    '/ca/cotizar', '/ca/guardar-remitente', '/ca/guardar-credenciales',
    '/ca/validar', '/ca/crear-orden', '/ca/cancelar-orden',
    '/ca/rotulos', '/ca/historial', '/ca/sucursales'
  ];

  window.cliente = {
    email: "trigomarisaadriana@gmail.com",
    whatsapp: "https://wa.me/5492901602482",
    mercado_pago: ""
  };
  window.VENDOR_EMAIL = window.cliente.email;
  window.carrito = [];

  const adminToken = sessionStorage.getItem('adminToken');
  const urlToken = new URLSearchParams(window.location.search).get('token');
  
  if (adminToken) {
    window.modoAdmin = true;
    window.adminToken = adminToken;
    if (urlToken) {
      const cleanUrl = window.location.pathname + window.location.search.replace(/[?&]token=[^&]*/, '').replace(/^&/, '?');
      history.replaceState(null, '', cleanUrl);
    }
  } else if (urlToken) {
    window.modoAdmin = true;
    window.adminToken = urlToken;
    sessionStorage.setItem('adminToken', urlToken);
    history.replaceState(null, '', window.location.pathname);
  } else {
    window.modoAdmin = false;
    window.adminToken = null;
  }

  // --- Interceptor fetch ---
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    options.headers = options.headers || {};
    
    let finalUrl = url;
    const isRelative = !url.startsWith('http://') && !url.startsWith('https://');
    
    if (isRelative) {
      const isStatic = url.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/i) ||
                       url.startsWith('/static/') ||
                       url.startsWith('/img/');
      
      if (window.modoAdmin) {
        if (!isStatic && url.startsWith('/api/')) {
          finalUrl = API_BASE + url;
        }
      } else {
        const shouldProxy = backendRoutes.some(route =>
          url === route || (route.endsWith('/') && url.startsWith(route))
        );
        if (!isStatic && shouldProxy) {
          finalUrl = API_BASE + url;
        }
      }
    }

    if (window.VENDOR_EMAIL) {
      options.headers['X-Vendor-Email'] = window.VENDOR_EMAIL;
    }
    
    // Token JWT si estamos en modo admin
    if (window.modoAdmin && window.adminToken) {
      options.headers['Authorization'] = `Bearer ${window.adminToken}`;
    }
    
    // No enviamos cookies porque usamos JWT
    options.credentials = 'omit';
    
    return originalFetch(finalUrl, options);
  };

  if (window.modoAdmin && !window.adminScriptLoaded) {
    window.adminScriptLoaded = true;
    const script = document.createElement('script');
    script.src = 'static/js/admin.js';
    script.defer = true;
    document.head.appendChild(script);
  }
})();
