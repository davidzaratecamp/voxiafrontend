# Voxia — Frontend

Panel de control multi-tenant de Voxia. Dos roles: el vendedor/operador (`admin`) da de alta clientes y ve la operación de todos; cada cliente (`client`) entra con su propia cuenta y gestiona solo lo suyo — prompt del agente, contactos, campañas, y sus propios costos.

## Instalación

```bash
cp .env.example .env   # opcional: solo si el backend no corre en http://localhost:4000
npm install
npm run dev              # http://localhost:5173
```

Requiere el [backend](../backend/README.md) corriendo (por defecto en `http://localhost:4000`), y un usuario con el que iniciar sesión (el admin sembrado por `npm run db:init` en el backend, o un cliente creado desde `/clientes`).

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API del backend (default: `http://localhost:4000/api/v1`) |

## Páginas

- **`/login`** — pública. No hay auto-registro: las cuentas de cliente las crea el admin desde `/clientes`.
- **`/` — Dashboard**: métricas clave (llamadas activas, minutos consumidos, tasa de éxito, costo estimado) y las últimas llamadas. Un `client` ve solo lo suyo; un `admin` ve el agregado de todos los clientes, o de uno solo si lo selecciona en el Sidebar.
- **`/contactos` — Campañas y contactos**: crear una campaña (nombre, tipo, voz del agente, instrucciones con placeholders) y cargar contactos en formato JSON. El proveedor de telefonía **no se elige aquí** — es fijo por cliente, asignado por el admin al darlo de alta.
- **`/monitor` — Live Monitor**: llamadas en curso, actualización automática cada 3 segundos.
- **`/clientes`** — solo `admin`. Da de alta un cliente nuevo (nombre + proveedor de telefonía fijo), crea/lista sus usuarios de acceso, resetea contraseñas, y muestra la URL del webhook + el secreto que hay que configurar en el troncal SIP del cliente cuando usa `openai_native_sip`.

## Autenticación

`src/context/AuthContext.jsx` guarda el JWT en `localStorage` y expone `login()`/`logout()`; `src/api/client.js` lo agrega como header `Authorization` en cada request y, si el backend responde `401`, limpia la sesión y redirige a `/login`. `src/components/ProtectedRoute.jsx` protege las rutas (con `requireRole="admin"` para `/clientes`) — no es solo un link oculto, la navegación directa por URL también redirige.

`src/context/OrgFilterContext.jsx` guarda qué organización está viendo un `admin` (selector en el Sidebar); Dashboard, Contactos y Live Monitor lo leen para filtrar sus datos. Para un `client` no aplica — el backend ya lo limita a su propia organización.

## Estructura

```
src/
├── api/           clientes HTTP por recurso (auth, organizations, campaigns, contacts, calls)
├── context/        AuthContext (sesión), OrgFilterContext (filtro de organización del admin)
├── components/     Sidebar, ProtectedRoute, StatTile, StatusBadge
├── hooks/          usePolling — refetch periódico para vistas en vivo
└── pages/          LoginPage, DashboardPage, ContactsPage, LiveMonitorPage, OrganizationsPage
```

Las vistas en vivo (Dashboard y Live Monitor) usan *polling* HTTP simple contra `/calls/live` y `/calls/metrics` en lugar de un WebSocket propio del frontend — el backend ya expone esos endpoints como snapshot, lo cual es suficiente para el MVP.
