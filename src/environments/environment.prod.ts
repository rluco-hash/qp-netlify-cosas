export const environment = {
  production: true,

  /* Ver la nota de environment.ts: es la misma URL, aparte para poder apuntar
     produccion a otra implementacion del Apps Script sin tocar el dev. */
  sheetEndpoint:
    'https://script.google.com/macros/s/AKfycbx9zR6LvacdNV_TE_PU5OycAFK8NX79PXkhiAMgx7lnoE55CV-41GipL5FC7rvc8_VROw/exec',

  /* En produccion nunca se muestran participantes falsos. */
  useMockData: false,
};
