import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CredentialsInterceptor } from './app/interceptors/credentials.interceptor';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // Registramos HttpClient con soporte DI para interceptors
    provideHttpClient(withInterceptorsFromDi()),
    // Módulos que usas en los standalone components
    importProvidersFrom(CommonModule, FormsModule, ReactiveFormsModule),
    // Aquí inyectamos nuestro interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi: true
    }
  ]
}).catch(err => console.error(err));
