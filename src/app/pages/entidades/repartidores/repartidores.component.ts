import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Repartidor } from '../../../models/models';
import { RepartidorService } from '../../../services/repartidor.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-repartidores',
  templateUrl: './repartidores.component.html',
  styleUrls: ['./repartidores.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  animations: [
    trigger('formAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class RepartidoresComponent implements OnInit {
  repartidores: Repartidor[] = [];
  filteredRepartidores: Repartidor[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Formulario
  repartidorForm: FormGroup;
  formMode: 'crear' | 'editar' | 'oculto' = 'oculto';
  submitted: boolean = false;

  // Modal de eliminación
  showDeleteModal: boolean = false;
  repartidorSeleccionado: Repartidor | null = null;

  // Búsqueda
  searchTerm: string = '';

  constructor(
    private repartidorService: RepartidorService,
    private formBuilder: FormBuilder
  ) {
    this.repartidorForm = this.formBuilder.group({
      id: [null],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      vehiculo: ['', Validators.required],
      licencia: ['', Validators.required],
      disponible: [true],
      pedidosEntregados: [0]
    });
  }

  ngOnInit(): void {
    this.getRepartidores();
  }

  get f() { return this.repartidorForm.controls; }

  getRepartidores(): void {
    this.loading = true;
    this.repartidorService.getRepartidores()
      .subscribe({
        next: (repartidores) => {
          this.repartidores = repartidores;
          this.filteredRepartidores = [...repartidores];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar repartidores', err);
          this.error = 'Error al cargar los repartidores. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
  }

  toggleFormMode(mode: 'crear' | 'editar' | 'oculto'): void {
    this.formMode = mode;
    this.submitted = false;

    if (mode === 'crear') {
      this.repartidorForm.reset({
        disponible: true,
        pedidosEntregados: 0
      });
    }
  }

  editarRepartidor(repartidor: Repartidor): void {
    this.repartidorForm.patchValue({
      id: repartidor.id,
      nombre: repartidor.nombre,
      apellido: repartidor.apellido,
      email: repartidor.email,
      telefono: repartidor.telefono,
      vehiculo: repartidor.vehiculo,
      licencia: repartidor.licencia,
      disponible: repartidor.disponible,
      pedidosEntregados: repartidor.pedidosEntregados
    });

    this.toggleFormMode('editar');
  }

  guardarRepartidor(): void {
    this.submitted = true;

    if (this.repartidorForm.invalid) {
      return;
    }

    const repartidorData = this.repartidorForm.value;

    if (this.formMode === 'crear') {
      this.repartidorService.crearRepartidor(repartidorData)
        .subscribe({
          next: (repartidor) => {
            this.repartidores.push(repartidor);
            this.filteredRepartidores = [...this.repartidores];
            this.toggleFormMode('oculto');
            // Mensaje de éxito
          },
          error: (err) => {
            console.error('Error al crear repartidor', err);
            // Mostrar mensaje de error
          }
        });
    } else {
      this.repartidorService.actualizarRepartidor(repartidorData)
        .subscribe({
          next: (repartidor) => {
            const index = this.repartidores.findIndex(r => r.id === repartidor.id);
            if (index !== -1) {
              this.repartidores[index] = repartidor;
              this.filteredRepartidores = [...this.repartidores];
            }
            this.toggleFormMode('oculto');
            // Mensaje de éxito
          },
          error: (err) => {
            console.error('Error al actualizar repartidor', err);
            // Mostrar mensaje de error
          }
        });
    }
  }

  confirmarEliminar(repartidor: Repartidor): void {
    this.repartidorSeleccionado = repartidor;
    this.showDeleteModal = true;
  }

  eliminarRepartidor(): void {
    if (!this.repartidorSeleccionado) return;

    this.repartidorService.eliminarRepartidor(this.repartidorSeleccionado.id!)
      .subscribe({
        next: (success) => {
          // @ts-ignore
          if (success) {
            this.repartidores = this.repartidores.filter(r => r.id !== this.repartidorSeleccionado!.id);
            this.filteredRepartidores = [...this.repartidores];
            this.showDeleteModal = false;
            this.repartidorSeleccionado = null;
            // Mensaje de éxito
          }
        },
        error: (err) => {
          console.error('Error al eliminar repartidor', err);
          // Mostrar mensaje de error
        }
      });
  }

  onSearchChange(): void {
    if (!this.searchTerm) {
      this.filteredRepartidores = [...this.repartidores];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredRepartidores = this.repartidores.filter(repartidor =>
      repartidor.nombre.toLowerCase().includes(term) ||
      repartidor.apellido.toLowerCase().includes(term) ||
      repartidor.email.toLowerCase().includes(term) ||
      repartidor.vehiculo.toLowerCase().includes(term) ||
      repartidor.licencia.toLowerCase().includes(term)
    );
  }
}
