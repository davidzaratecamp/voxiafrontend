import { useEffect, useState } from 'react';

/**
 * Como useState, pero el valor vuelve a null solo despues de `delayMs` --
 * para banners de "guardado"/"listo" que no deben quedar pegados en
 * pantalla hasta que alguien recargue la pagina.
 */
export function useAutoDismiss(delayMs = 4000) {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), delayMs);
    return () => clearTimeout(id);
  }, [message, delayMs]);

  return [message, setMessage];
}
