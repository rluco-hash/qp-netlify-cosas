// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  /* URL /exec del Apps Script publicado como aplicacion web con acceso
     "Cualquier persona". Cada implementacion nueva genera un ID distinto: si el
     ranking queda en "Sin conexion", lo primero es revisar que esta URL sea la
     de la ultima implementacion. */
  sheetEndpoint:
    'https://script.google.com/macros/s/AKfycbx9zR6LvacdNV_TE_PU5OycAFK8NX79PXkhiAMgx7lnoE55CV-41GipL5FC7rvc8_VROw/exec',

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
