import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  catchError,
  from,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';

import { environment } from '../environments/environment';

interface SheetRow {
  /* Opcional a proposito: el backend de hoy no lo manda. Cuando falta, rank()
     arma el id con nombre + empresa (ver uniqueIdOf). */
  row_number?: number;
  'Marca temporal': string;
  'Nombre completo': string;
  Cargo: string;
  'Puntaje Dados': number;
  /* Ojo: hasta la version anterior del backend este campo se llamaba
     'Puntaje Raspe'. Si vuelve a cambiar de nombre el puntaje se lee como 0 y
     el ranking queda ordenado solo por los dados, sin ningun error visible. */
  'Puntaje Ruleta': number;
  'Nombre Empresa': string;
  Total: number;

  /* Columnas que la planilla manda pero el ranking no muestra: son datos de
     contacto y de gestion de la campania. Van opcionales porque el backend las
     agrego despues y no hay garantia de que sigan viniendo. */
  'Teléfono'?: string;
  Desuscrito?: string;
  Rebote?: string;
  Cluster?: string;
}

interface SheetResponse {
  data: SheetRow[];
  total: number;
}

/** Fila ya rankeada y comparada contra el poll anterior. */
interface RankedRow {
  /* String y no el row_number crudo: es la unica clave que sobrevive a un poll
     y sirve de track del @for, venga o no el numero de fila. */
  id: string;
  position: number;
  name: string;
  /** Cargo declarado en la inscripcion; puede venir vacio. */
  role: string;
  company: string;
  /** Cargo y empresa en una linea, que es como los muestra el listado. */
  subtitle: string;
  /** Medalla del puesto (vacia del cuarto en adelante). */
  medal: string;
  dados: number;
  ruleta: number;
  total: number;
  /** Puestos ganados desde el poll anterior (negativo = perdidos). */
  delta: number;
  isNew: boolean;
  justScored: boolean;
}

/** Tarjeta de red social con su QR ya generado (src/assets/qr). */
interface SocialLink {
  key: string;
  label: string;
  detail: string;
  /** Clase de Font Awesome; se ignora si hay iconImg. */
  icon?: string;
  /** Logo propio (SVG de assets/imgs) para las marcas que no estan en FA. */
  iconImg?: string;
  url: string;
  qr: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {
  /** Medallas del podio, indexadas por puesto. */
  private static readonly medals: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  title = 'angular-quickstart';
  iframeUrl: { default?: SafeResourceUrl; community?: SafeResourceUrl } = {};

  /** Fecha del sorteo, anunciada junto al premio. */
  readonly raffleDate = '1 de septiembre';

  private readonly whatsappNumber = '56971502877';
  private readonly whatsappMessage =
    'Hola QuePlan, les escribo desde Desafío Bienestar.';

  /* Los QR son SVG estaticos generados offline (encoder QR sobre las URLs de
     abajo). Si cambia una URL hay que regenerar el SVG correspondiente. */
  readonly socials: SocialLink[] = [
    {
      key: 'comparador',
      label: 'Comparador',
      detail: 'queplan.cl',
      iconImg: 'assets/imgs/lupa_qp.svg',
      url: 'https://www.queplan.cl',
      qr: 'assets/qr/qr-comparador.svg',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      detail: '@queplancl',
      icon: 'fab fa-instagram',
      url: 'https://www.instagram.com/queplancl/',
      qr: 'assets/qr/qr-instagram.svg',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      detail: 'QuePlan',
      icon: 'fab fa-linkedin-in',
      url: 'https://www.linkedin.com/company/queplan.cl/',
      qr: 'assets/qr/qr-linkedin.svg',
    },
  ];

  /* Apps Script publicado como aplicacion web: devuelve { data, total } con
     las filas del Sheet de inscripciones. La URL vive en environments/. */
  private readonly endpoint = environment.sheetEndpoint;
  private readonly pollIntervalMs = 60000;
  private readonly destroy$ = new Subject<void>();

  /** Posicion y puntaje del poll anterior, para detectar movimientos. */
  private previousPositions = new Map<string, number>();
  private previousTotals = new Map<string, number>();
  private firstLoad = true;

  rows: RankedRow[] = [];
  isLoading = true;
  hasError = false;
  lastUpdated: Date | null = null;

  /** Participantes por pagina en el listado. */
  readonly pageSize = 10;
  page = 0;

  /* Filas fantasma del esqueleto de carga: cinco alcanzan para que se lea como
     lista sin ocupar la pantalla entera mientras responde el Apps Script. */
  readonly skeletonRows = Array.from({ length: 5 });

  /* El podio y la lista muestran los mismos datos: 'lista' solo oculta el podio
     para dejar el ranking plano de corrido. */
  view: 'podio' | 'lista' = 'podio';

  constructor(private _http: HttpClient) {}

  ngOnInit(): void {
    timer(0, this.pollIntervalMs)
      .pipe(
        switchMap(() => this.fetchSheet()),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        this.isLoading = false;

        if (!response) {
          this.hasError = true;
          return;
        }

        this.hasError = false;
        this.rows = this.rank(response.data ?? []);
        this.lastUpdated = new Date();
        this.firstLoad = false;
        // Si alguien se dio de baja, la ultima pagina puede dejar de existir:
        // se queda en la ultima valida en vez de mostrar una pagina vacia.
        this.page = Math.min(this.page, this.totalPages - 1);
      });
  }

  /* Fuente del poll: el Apps Script, salvo que environment.useMockData este en
     true, y ahi se responde con los 11 participantes falsos de
     mock-sheet-data.json sin pegarle a ningun endpoint.

     El mock entra por import dinamico a proposito: con la bandera apagada el
     JSON queda en un chunk aparte que el navegador nunca pide. */
  private fetchSheet(): Observable<SheetResponse | null> {
    if (environment.useMockData) {
      return from(import('./mock-sheet-data.json')).pipe(
        map((mock) => mock.default as unknown as SheetResponse),
      );
    }

    /* El parametro sirve solo para que la URL cambie en cada poll: sin el, el
       CDN delante del backend respondia el ranking cacheado (cf-cache-status
       HIT) y la pantalla se quedaba varios minutos con puntajes viejos. */
    return this._http
      .get<SheetResponse>(this.endpoint, { params: { _: Date.now() } })
      .pipe(catchError(() => of(null)));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Los tres del podio, ya ordenados por puntaje. */
  get podiumRows(): RankedRow[] {
    return this.rows.slice(0, 3);
  }

  /** Los 10 del tramo visible del listado (que arranca en el primer puesto). */
  get pagedRows(): RankedRow[] {
    const start = this.page * this.pageSize;

    return this.rows.slice(start, start + this.pageSize);
  }

  /** Siempre 1 como minimo: con lista vacia no existe la "pagina 0 de 0". */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get hasPages(): boolean {
    return this.rows.length > this.pageSize;
  }

  /** Puesto del primero y del ultimo de la pagina, para el "1 – 10 de 57". */
  get pageFrom(): number {
    return this.page * this.pageSize + 1;
  }

  get pageTo(): number {
    return Math.min(this.pageFrom + this.pageSize - 1, this.rows.length);
  }

  setView(view: 'podio' | 'lista'): void {
    this.view = view;
  }

  /* El desglose ya no ocupa lugar en la fila (el disenio la deja limpia): vive
     en el title, a un hover de distancia. */
  breakdownOf(row: RankedRow): string {
    const puntajes = `Dados ${row.dados.toLocaleString('es-CL')} · Ruleta ${row.ruleta.toLocaleString(
      'es-CL',
    )}`;

    return row.role ? `${row.role} — ${puntajes}` : puntajes;
  }

  goToPage(page: number): void {
    this.page = Math.min(Math.max(page, 0), this.totalPages - 1);
  }

  get whatsappUrl(): string {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(
      this.whatsappMessage,
    )}`;
  }

  trackByRow(_index: number, row: RankedRow): string {
    return row.id;
  }

  trackBySocial(_index: number, social: SocialLink): string {
    return social.key;
  }

  private rank(data: SheetRow[]): RankedRow[] {
    /* Los ids se resuelven en el orden en que llega la planilla y no en el del
       ranking: asi el desempate entre homonimos no baila cuando cambian los
       puntajes. */
    const taken = new Set<string>();
    const identified = data.map((row) => ({
      row,
      id: this.uniqueIdOf(row, taken),
    }));

    const ordered = identified.sort(
      (a, b) => AppComponent.totalOf(b.row) - AppComponent.totalOf(a.row),
    );

    const ranked = ordered.map(({ row, id }, index) => {
      const position = index + 1;
      const role = (row.Cargo || '').trim();
      const company = (row['Nombre Empresa'] || '').trim();
      const dados = Number(row['Puntaje Dados']) || 0;
      const ruleta = Number(row['Puntaje Ruleta']) || 0;
      const total = AppComponent.totalOf(row, dados, ruleta);
      const previousPosition = this.previousPositions.get(id);
      const previousTotal = this.previousTotals.get(id);

      return {
        id,
        position,
        name: (row['Nombre completo'] || '').trim() || 'Participante',
        role,
        company,
        subtitle: [role, company].filter(Boolean).join(' · '),
        medal: AppComponent.medals[position] ?? '',
        dados,
        ruleta,
        total,
        delta: previousPosition === undefined ? 0 : previousPosition - position,
        isNew: !this.firstLoad && previousPosition === undefined,
        justScored: previousTotal !== undefined && previousTotal !== total,
      };
    });

    this.previousPositions = new Map(
      ranked.map((row) => [row.id, row.position]),
    );
    this.previousTotals = new Map(ranked.map((row) => [row.id, row.total]));

    return ranked;
  }

  /* Id estable entre polls: es lo que deja saber que este "Franco" es el mismo
     de hace un minuto y, por lo tanto, cuantos puestos subio o bajo.
     Con row_number alcanza; sin el, la identidad es nombre + empresa, y si dos
     participantes comparten las dos cosas el segundo se lleva un sufijo para
     que el track del @for no vea claves repetidas. */
  private uniqueIdOf(row: SheetRow, taken: Set<string>): string {
    const base =
      row.row_number == null
        ? `${(row['Nombre completo'] || '').trim().toLowerCase()}|${(
            row['Nombre Empresa'] || ''
          )
            .trim()
            .toLowerCase()}`
        : `row-${row.row_number}`;

    let id = base;
    let duplicate = 2;

    while (taken.has(id)) {
      id = `${base}#${duplicate++}`;
    }

    taken.add(id);

    return id;
  }

  /* El backend manda Total ya sumado, pero el ranking no depende de eso: si la
     columna llega vacia o en cero con puntajes cargados, se suman los dos
     juegos. Asi un Total que no se actualizo no manda a nadie al ultimo puesto. */
  private static totalOf(
    row: SheetRow,
    dados = Number(row['Puntaje Dados']) || 0,
    ruleta = Number(row['Puntaje Ruleta']) || 0,
  ): number {
    const total = Number(row.Total);

    return Number.isFinite(total) && total > 0 ? total : dados + ruleta;
  }

}
