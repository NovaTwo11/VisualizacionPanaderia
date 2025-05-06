// src/app/services/pedido.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Pedido } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private apiUrl = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) { }

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
      return of(result as T);
    };
  }
}
