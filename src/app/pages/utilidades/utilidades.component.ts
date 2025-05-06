import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { UtilidadesService } from '../../services/utilidades.service';
import {BackupHistory, BackupRequest, ExportRequest, ImportRequest} from '../../models/models';
import {DatePipe, DecimalPipe, NgForOf, NgIf} from '@angular/common';

interface Permiso {
  id: number;
  modulo: string;
  admin: boolean;
  supervisor: boolean;
  operador: boolean;
}

type BackupBooleans = {
  type: 'full' | 'partial';
  clientes: boolean;
  productos: boolean;
  pedidos: boolean;
  repartidores: boolean;
  administradores: boolean;
  description: string;
};

@Component({
  selector: 'app-utilidades',
  templateUrl: './utilidades.component.html',
  styleUrls: ['./utilidades.component.css'],
  imports: [
    FormsModule,
    DatePipe,
    ReactiveFormsModule,
    NgIf,
    NgForOf,
    DecimalPipe
  ],
  standalone: true
})
export class UtilidadesComponent implements OnInit {
  activeTab = 'exportar';
  activeAccordion: string | null = null;

  // Exportar
  exportOptions = {
    clientes: true,
    productos: true,
    pedidos: false,
    repartidores: false,
    administradores: false,
    format: 'csv' as const,
    includeHeaders: true,
    compress: false
  };


  // Importar
  importOptions: ImportRequest = {
    dataType: 'productos',
    updateExisting: true,
    skipErrors: false,
    hasHeaders: true
  };
  importFileName = '';
  importFile: File | null = null;

  // Respaldo
  backupOptions: BackupBooleans = {
    type: 'full',
    clientes: true,
    productos: true,
    pedidos: true,
    repartidores: true,
    administradores: true,
    description: ''
  };

  backups: BackupHistory[] = [];
  selectedBackup: number | null = null;

  // Restaurar
  restoreConfirmed = false;
  restoreFileName = '';
  restoreFile: File | null = null;

  // Configuración
  generalForm: FormGroup;
  temaForm: FormGroup;
  notificacionesForm: FormGroup;

  permisos: Permiso[] = [
    { id: 1, modulo: 'Dashboard', admin: true, supervisor: true, operador: true },
    { id: 2, modulo: 'Clientes', admin: true, supervisor: true, operador: false },
    { id: 3, modulo: 'Productos', admin: true, supervisor: true, operador: true },
    { id: 4, modulo: 'Pedidos', admin: true, supervisor: true, operador: true },
    { id: 5, modulo: 'Repartidores', admin: true, supervisor: true, operador: false },
    { id: 6, modulo: 'Administradores', admin: true, supervisor: false, operador: false },
    { id: 7, modulo: 'Reportes', admin: true, supervisor: true, operador: false },
    { id: 8, modulo: 'Configuración', admin: true, supervisor: false, operador: false }
  ];

  constructor(private formBuilder: FormBuilder, private utilService: UtilidadesService) {
    this.generalForm = this.formBuilder.group({
      nombreNegocio: ['Panadería El Buen Sabor'],
      direccion: ['Calle Principal #123, Ciudad'],
      telefono: ['555-123-4567'],
      email: ['contacto@panaderiaelbuensabor.com'],
      moneda: ['USD'],
      zonaHoraria: ['America/Mexico_City']
    });

    this.temaForm = this.formBuilder.group({
      tema: ['default'],
      colorPrimario: ['#E76F51'],
      colorSecundario: ['#F4A261']
    });

    this.notificacionesForm = this.formBuilder.group({
      notificarNuevosPedidos: [true],
      notificarCambiosEstado: [true],
      notificarStockBajo: [true],
      notificarEmail: [false],
      umbralStockBajo: [10]
    });
  }


  ngOnInit(): void {
    this.loadBackups();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleAccordion(section: string): void {
    this.activeAccordion = this.activeAccordion === section ? null : section;
  }

  // --- Exportar Datos ---
  exportarDatos(): void {
    const req: ExportRequest = {
      entities: [
        ...(this.exportOptions.clientes       ? ['clientes']       : []),
        ...(this.exportOptions.productos      ? ['productos']      : []),
        ...(this.exportOptions.pedidos        ? ['pedidos']        : []),
        ...(this.exportOptions.repartidores   ? ['repartidores']   : []),
        ...(this.exportOptions.administradores? ['administradores']: [])
      ],
      format: this.exportOptions.format,
      includeHeaders: this.exportOptions.includeHeaders,
      compress: this.exportOptions.compress
    };

    this.utilService.export(req).subscribe(blob => {
      const ext = req.format;
      const name = `export.${ext}${req.compress ? '.zip' : ''}`;
      this.downloadFile(blob, name);
    }, err => {
      console.error(err);
      alert('Error al exportar datos');
    });
  }



  // --- Importar Datos ---
  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.importFile = input.files[0];
      this.importFileName = this.importFile.name;
    }
  }

  importarDatos(): void {
    if (!this.importFile) return;
    this.utilService.import(this.importOptions, this.importFile).subscribe(() => {
      alert('Importado correctamente');
      this.resetImportForm();
    }, err => {
      console.error(err);
      alert('Error al importar datos');
    });
  }

  resetImportForm(): void {
    this.importOptions = { dataType: 'productos', updateExisting: true, skipErrors: false, hasHeaders: true };
    this.importFile = null;
    this.importFileName = '';
  }

  // --- Respaldo y Restauración ---
  crearRespaldo(): void {
    const req: BackupRequest = {
      type: this.backupOptions.type,
      entities: [
        ...(this.backupOptions.clientes        ? ['clientes']       : []),
        ...(this.backupOptions.productos       ? ['productos']      : []),
        ...(this.backupOptions.pedidos         ? ['pedidos']        : []),
        ...(this.backupOptions.repartidores    ? ['repartidores']   : []),
        ...(this.backupOptions.administradores ? ['administradores']: [])
      ],
      description: this.backupOptions.description
    };

    this.utilService.backup(req).subscribe(hist => {
      this.backups.unshift(hist);
      alert('Respaldo creado');
    }, err => {
      console.error(err);
      alert('Error al crear respaldo');
    });
  }



  loadBackups(): void {
    this.utilService.history().subscribe(list => this.backups = list);
  }

  descargarRespaldo(id: number): void {
    this.utilService.downloadBackup(id).subscribe(blob => {
      this.downloadFile(blob, `backup-${id}.zip`);
    }, err => {
      console.error(err);
      alert('Error al descargar respaldo');
    });
  }

  seleccionarBackup(id: number): void {
    this.selectedBackup = id;
    this.restoreConfirmed = false;
  }

  restaurarDatos(): void {
    if (!this.selectedBackup || !this.restoreConfirmed) return;
    this.utilService.restore({ backupId: this.selectedBackup }).subscribe(() => {
      alert('Restauración completada');
      this.selectedBackup = null;
      this.restoreConfirmed = false;
    }, err => {
      console.error(err);
      alert('Error al restaurar datos');
    });
  }

  // --- Restaurar desde archivo ---
  onRestoreFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.restoreFile = input.files[0];
      this.restoreFileName = this.restoreFile.name;
    }
  }

  restaurarDesdeArchivo(): void {
    if (!this.restoreFile) return;
    this.utilService.restoreFromFile(this.restoreFile).subscribe(() => {
      alert('Restauración desde archivo completada');
      this.restoreFile = null;
      this.restoreFileName = '';
    }, err => {
      console.error(err);
      alert('Error al restaurar desde archivo');
    });
  }

  // ---> Helper para descargar blobs sin file-saver
  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  guardarConfiguracionGeneral() {

  }

  aplicarTema()
    : void
  {
    const tema = this.temaForm.get("tema")?.value || "default"

    // Eliminar clases de tema anteriores
    document.body.classList.remove("default-theme", "dark-theme", "light-theme", "colorful-theme")

    // Añadir la nueva clase de tema
    document.body.classList.add(`${tema}-theme`)

    // Guardar preferencia en localStorage
    localStorage.setItem("tema_actual", tema)

    console.log(`Tema aplicado: ${tema}`)
  }

// Modificar el método guardarTema
  guardarTema()
    : void
  {
    console.log("Tema guardado:", this.temaForm.value)

    // Aplicar el tema
    this.aplicarTema()

    alert("Tema aplicado correctamente")
  }

  // Configuración
  seleccionarTema(tema: string): void {
    this.temaForm.patchValue({ tema });

    // Actualizar colores según el tema seleccionado
    switch (tema) {
      case 'default':
        this.temaForm.patchValue({ colorPrimario: '#E76F51', colorSecundario: '#F4A261' });
        break;
      case 'dark':
        this.temaForm.patchValue({ colorPrimario: '#2D3748', colorSecundario: '#4A5568' });
        break;
      case 'light':
        this.temaForm.patchValue({ colorPrimario: '#EDF2F7', colorSecundario: '#E2E8F0' });
        break;
      case 'colorful':
        this.temaForm.patchValue({ colorPrimario: '#6B46C1', colorSecundario: '#3182CE' });
        break;
    }
  }

  resetearTema(): void {
    this.seleccionarTema('default');
  }


  guardarPermisos(): void {
    console.log('Permisos guardados:', this.permisos);
    // Aquí iría la lógica para guardar los permisos

    alert('Permisos guardados correctamente');
  }

  guardarNotificaciones(): void {
    console.log('Configuración de notificaciones guardada:', this.notificacionesForm.value);
    // Aquí iría la lógica para guardar la configuración de notificaciones

    alert('Configuración de notificaciones guardada correctamente');
  }


}
