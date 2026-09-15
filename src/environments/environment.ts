// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  /* En dev se le pega al backend a traves del proxy de ng serve
     (proxy.conf.json: /api -> https://leaderboard-back.queplan.cl), porque el
     backend no devuelve Access-Control-Allow-Origin y el navegador corta la
     llamada directa por CORS. El proxy hace la peticion desde el servidor de
     desarrollo, asi que para el navegador queda como same-origin. */
  sheetEndpoint: '/api/leaderboard',

  /* true = la pantalla se llena con los participantes falsos de
     mock-sheet-data.json y no se le pega a sheetEndpoint. Sirve para QA de
     disenio sin depender del Sheet. */
  useMockData: false,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
