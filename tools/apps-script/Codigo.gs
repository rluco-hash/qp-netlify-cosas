/* Apps Script del ranking: publica el Sheet de inscripciones como JSON para
   que el scoreboard (src/app/app.component.ts) lo consulte cada 60 s.

   Publicar:
     1. Extensiones > Apps Script sobre el Sheet de respuestas del formulario.
     2. Pegar este archivo y ajustar SHEET_NAME si la hoja no se llama asi.
     3. Implementar > Nueva implementacion > Aplicacion web.
          Ejecutar como: Yo
          Quien tiene acceso: Cualquier persona
     4. Copiar la URL /exec y pegarla en src/environments/environment.ts
        (y en environment.prod.ts) como sheetEndpoint.

   Ojo: cada "Nueva implementacion" genera una URL distinta. Para conservar la
   URL hay que usar "Administrar implementaciones > Editar > Version nueva".

   Este archivo es la referencia del contrato, no el script en produccion: el
   que esta publicado hoy devuelve las mismas columnas pero SIN row_number. El
   front aguanta las dos formas (ver uniqueIdOf en app.component.ts); igual con
   row_number el ranking sigue mejor a cada participante, porque dos homonimos
   de la misma empresa dejan de confundirse. */

var SHEET_NAME = 'Respuestas de formulario 1';

/* Columnas que se publican. El correo corporativo queda fuera a proposito: la
   pantalla es publica y no necesita datos de contacto. */
var COLUMNS = [
  'Marca temporal',
  'Nombre completo',
  'Cargo',
  'Puntaje Dados',
  'Puntaje Raspe',
  'Nombre Empresa',
  'Total',
];

var NUMERIC_COLUMNS = ['Puntaje Dados', 'Puntaje Raspe', 'Total'];

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    return json({ data: [], total: 0, error: 'No existe la hoja ' + SHEET_NAME });
  }

  var values = sheet.getDataRange().getValues();
  var headers = values.shift() || [];
  var data = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    // row_number es el numero de fila real del Sheet (la 1 es el encabezado):
    // el front lo usa como id estable para detectar quien subio o bajo puestos.
    var item = { row_number: i + 2 };
    var hasContent = false;

    for (var c = 0; c < COLUMNS.length; c++) {
      var name = COLUMNS[c];
      var index = headers.indexOf(name);
      var value = index === -1 ? '' : row[index];

      if (NUMERIC_COLUMNS.indexOf(name) !== -1) {
        value = Number(value) || 0;
      } else if (value instanceof Date) {
        value = Utilities.formatDate(value, 'America/Santiago', 'yyyy-MM-dd HH:mm:ss');
      } else {
        value = String(value == null ? '' : value).trim();
      }

      if (value !== '' && value !== 0) {
        hasContent = true;
      }

      item[name] = value;
    }

    // Las filas vacias del final del Sheet no son participantes.
    if (hasContent) {
      data.push(item);
    }
  }

  return json({ data: data, total: data.length });
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
