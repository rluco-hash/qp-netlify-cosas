export const environment = {
  production: true,

  /* Ver la nota de environment.ts: es la misma URL, aparte para poder apuntar
     produccion a otra implementacion del Apps Script sin tocar el dev. */
  sheetEndpoint: 'https://app-sample-e8c098cfc70b.herokuapp.com/leaderboard',

  /* En produccion nunca se muestran participantes falsos. */
  useMockData: false,
};
