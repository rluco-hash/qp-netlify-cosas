// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  /* URL del backend que sirve el ranking. Se le pega directo: si el navegador
     corta la llamada por CORS ("Sin conexion" en pantalla y un error de
     Access-Control-Allow-Origin en la consola), el arreglo va del lado del
     backend, que tiene que mandar ese header y bajar el
     crossOriginResourcePolicy de helmet a 'cross-origin'. */
  sheetEndpoint: 'https://leaderboard-back.queplan.cl/leaderboard',

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
