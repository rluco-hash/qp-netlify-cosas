export const environment = {
  production: true,

  /* Ruta relativa a proposito: en produccion la llamada la proxea Netlify
     (ver el redirect /api/* de netlify.toml) igual que el proxy de ng serve en
     dev, porque el backend no devuelve Access-Control-Allow-Origin. Si algun
     dia se apunta a otro backend, revisar el redirect y no solo esta linea. */
  sheetEndpoint: '/api/leaderboard',

  /* En produccion nunca se muestran participantes falsos. */
  useMockData: false,
};
