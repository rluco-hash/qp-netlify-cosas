import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import localeEsCL from '@angular/common/locales/es-CL';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

/* Sin esto los puntajes salen con coma de miles (9,920): el ranking se lee en
   Chile, va con punto (9.920). */
registerLocaleData(localeEsCL);

@NgModule({ declarations: [AppComponent],
    bootstrap: [AppComponent], imports: [BrowserModule, AppRoutingModule], providers: [{ provide: LOCALE_ID, useValue: 'es-CL' }, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {}
