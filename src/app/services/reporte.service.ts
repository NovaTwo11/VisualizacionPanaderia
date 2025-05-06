// src/app/services/reporte.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReporteDetalle } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private baseUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  /**
   * Productos: si periodoInicio/Fin son undefined o '', no se añaden.
   */
  getReporteProductos(
    periodoInicio?: string,
    periodoFin?: string,
    tipoReporte: 'GENERAL' | 'POR_PRODUCTO' | 'POR_CLIENTE' = 'POR_PRODUCTO'
  ): Observable<ReporteDetalle[]> {
    let params = new HttpParams().set('tipoReporte', tipoReporte);
    if (periodoInicio) { params = params.set('periodoInicio', periodoInicio); }
    if (periodoFin)    { params = params.set('periodoFin',    periodoFin);  }

    return this.http.get<ReporteDetalle[]>(
      `${this.baseUrl}/productos`,
      { params }
    );
  }

  /**
   * Ventas: igual, + método de pago opcional
   */
  getReporteVentas(paramsObj: {
    periodoInicio?: string;
    periodoFin?: string;
    tipoReporte: 'GENERAL' | 'POR_PRODUCTO' | 'POR_CLIENTE';
    metodoPago?: string;
  }): Observable<ReporteDetalle[]> {
    let params = new HttpParams()
      .set('tipoReporte', paramsObj.tipoReporte);

    if (paramsObj.periodoInicio) {
      params = params.set('periodoInicio', paramsObj.periodoInicio);
    }
    if (paramsObj.periodoFin) {
      params = params.set('periodoFin', paramsObj.periodoFin);
    }
    if (paramsObj.metodoPago && paramsObj.metodoPago !== 'TODOS') {
      params = params.set('metodoPago', paramsObj.metodoPago);
    }

    return this.http.get<ReporteDetalle[]>(
      `${this.baseUrl}/ventas`,
      { params }
    );
  }
}
