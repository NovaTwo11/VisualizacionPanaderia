import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BackupHistory, BackupRequest, ExportRequest, ImportRequest, RestoreRequest} from '../models/models';


@Injectable({providedIn: 'root'})
export class UtilidadesService {
  private base = 'http://localhost:8080/api/utilidades';
  constructor(private http: HttpClient) {}

  export(opts: ExportRequest): Observable<Blob> {
    return this.http.post(
      `${this.base}/export`,
      opts,
      { responseType: 'blob' }
    );
  }


  import(request: ImportRequest, file: File): Observable<void> {
    const form = new FormData();
    form.append(
      'request',
      new Blob([JSON.stringify(request)], { type: 'application/json' })
    );
    form.append('file', file, file.name);
    return this.http.post<void>(
      `${this.base}/import`,
      form
    );
  }


  backup(req: BackupRequest): Observable<BackupHistory> {
    return this.http.post<BackupHistory>(`${this.base}/backup`, req);
  }

  listBackups(): Observable<BackupHistory[]> {
    return this.http.get<BackupHistory[]>(`${this.base}/backup-history`);
  }

  downloadBackup(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/backup/${id}/download`, { responseType: 'blob' });
  }

  restore(request: RestoreRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/restore`, request);
  }

  // Listar historial
  history(): Observable<BackupHistory[]> {
    return this.http.get<BackupHistory[]>(`${this.base}/history`);
  }

  restoreFromFile(file: File): Observable<void> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('fileName', file.name);
    return this.http.post<void>(`${this.base}/restore-file`, form);
  }

}
