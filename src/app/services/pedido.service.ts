// src/app/services/pedido.service.ts
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Pedido } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private apiUrl = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient, private zone: NgZone) { }

  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl)
      .pipe(
        // convertir strings a Date
        map(peds => peds.map(p => ({ ...p, fecha: new Date(p.fecha) }))),
        catchError(this.handleError<Pedido[]>('getPedidos', []))
      );
  }

  getPedido(id: number): Observable<Pedido> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Pedido>(url)
      .pipe(
        map(p => ({ ...p, fecha: new Date(p.fecha) })),
        catchError(this.handleError<Pedido>(`getPedido id=${id}`))
      );
  }

  crearPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido)
      .pipe(
        map(p => ({ ...p, fecha: new Date(p.fecha) })),
        catchError(this.handleError<Pedido>('crearPedido'))
      );
  }

  actualizarPedido(pedido: Pedido): Observable<Pedido> {
    const url = `${this.apiUrl}/${pedido.id}`;
    return this.http.put<Pedido>(url, pedido)
      .pipe(
        map(p => ({ ...p, fecha: new Date(p.fecha) })),
        catchError(this.handleError<Pedido>('actualizarPedido'))
      );
  }

  eliminarPedido(id: number): Observable<boolean> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<boolean>(url)
      .pipe(
        catchError(this.handleError<boolean>('eliminarPedido', false))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return throwError(() => error);
    };
  }

  /** Retorna la cantidad de pedidos realizados HOY */
  countToday(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/today`);
  }

  /** Retorna la suma de ventas del mes actual */
  sumMonthlySales(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/sum/monthly`);
  }

  /** Abre una conexión SSE al backend y emite cada nuevo pedido */
  onNewOrder(): Observable<Pedido> {
    return new Observable<Pedido>(subscriber => {
      const evtSource = new EventSource(`${this.apiUrl}/stream`);
      evtSource.onmessage = event => {
        const ped: Pedido = JSON.parse(event.data);
        this.zone.run(() => subscriber.next(ped));
      };
      evtSource.onerror = err => {
        this.zone.run(() => subscriber.error(err));
        evtSource.close();
      };
      return () => evtSource.close();
    });
  }
}
