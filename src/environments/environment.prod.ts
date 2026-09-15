export const environment = {
  production: true,

  /* Ver la nota de environment.ts: es la misma URL, aparte para poder apuntar
     produccion a otro backend sin tocar el dev. */
  sheetEndpoint: 'https://leaderboard-back.queplan.cl/leaderboard',

  /* En produccion nunca se muestran participantes falsos. */
  useMockData: false,
};
