// Prefijos de ruta que exigen sesión iniciada (verificado en el middleware).
// El detalle de producto (/producto/[id]) es intencionalmente público.
export const PROTECTED_ROUTE_PREFIXES = ["/carrito", "/pedidos", "/favoritos", "/vendedor"] as const;
