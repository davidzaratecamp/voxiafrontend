import { createContext, useContext, useState } from 'react';

// Solo relevante para el rol admin: que organizacion esta viendo en
// Dashboard/Contactos/Live Monitor. Vive en un contexto propio (separado de
// AuthContext) para que el Sidebar pueda escribirlo y las paginas leerlo sin
// pasar props por todo el arbol. undefined/'' = agregado de todas.
const OrgFilterContext = createContext(null);

export function OrgFilterProvider({ children }) {
  const [organizationId, setOrganizationId] = useState('');
  return (
    <OrgFilterContext.Provider value={{ organizationId, setOrganizationId }}>
      {children}
    </OrgFilterContext.Provider>
  );
}

export function useOrgFilter() {
  const ctx = useContext(OrgFilterContext);
  if (!ctx) throw new Error('useOrgFilter debe usarse dentro de <OrgFilterProvider>');
  return ctx;
}
