import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bitacora } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {

  private apiUrl = 'http://localhost:8080/api/bitacora';

  constructor(
    private http: HttpClient,
    private zone: NgZone
  ) {}

  /** Registra un evento de bitácora */
  registrar(usuarioId: number, evento: string, detalle?: string): Observable<Bitacora> {
    return this.http.post<Bitacora>(this.apiUrl, { usuarioId, evento, detalle });
  }

  /**
   * Trae logs entre dos fechas (ISO strings).
   * Si se pasa usuarioId, añade ese filtro.
   */
  listar(
    desdeIso: string,
    hastaIso: string,
    usuarioId?: number
  ): Observable<Bitacora[]> {
    let params = new HttpParams()
      .set('desde', desdeIso)
      .set('hasta', hastaIso);
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId.toString());
    }
    return this.http.get<Bitacora[]>(this.apiUrl, {
      params,
      withCredentials: true
    });
  }
}
