import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Administrador } from '../../../models/models';
import { AdministradorService } from '../../../services/administrador.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-administradores',
  templateUrl: './administradores.component.html',
  styleUrls: ['./administradores.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
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
export class AdministradoresComponent implements OnInit {
  administradores: Administrador[] = [];
  filteredAdministradores: Administrador[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Formulario
  adminForm: FormGroup;
  formMode: 'crear' | 'editar' | 'oculto' = 'oculto';
  submitted: boolean = false;

  // Modal de eliminación
  showDeleteModal: boolean = false;
  adminSeleccionado: Administrador | null = null;

  // Búsqueda
  searchTerm: string = '';

  constructor(
    private administradorService: AdministradorService,
    private formBuilder: FormBuilder
  ) {
    this.adminForm = this.formBuilder.group({
      id: [null],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      telefono: ['', Validators.required],
      rol: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.getAdministradores();
  }

  // Getter para acceder fácilmente a los controles del formulario
  get f() { return this.adminForm.controls; }

  // Obtener la lista de administradores desde el backend
  getAdministradores(): void {
    this.loading = true;
    this.administradorService.getAdministradores()
      .subscribe({
        next: (administradores) => {
          this.administradores = administradores;
          this.filteredAdministradores = [...administradores];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar administradores', err);
          this.error = 'Error al cargar los administradores. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
  }

  // Cambiar el modo del formulario entre "crear", "editar" y "oculto"
  toggleFormMode(mode: 'crear' | 'editar' | 'oculto'): void {
    this.formMode = mode;
    this.submitted = false;

    if (mode === 'crear') {
      this.adminForm.reset({
        activo: true
      });
    }
  }

  // Cargar los datos del administrador en el formulario para editar
  editarAdministrador(admin: Administrador): void {
    this.adminForm.patchValue({
      id: admin.id,
      nombre: admin.nombre,
      apellido: admin.apellido,
      email: admin.email,
      telefono: admin.telefono,
      rol: admin.rol,
      activo: admin.activo
    });

    this.toggleFormMode('editar');
  }

  // Guardar nuevo administrador o actualizar el existente
  guardarAdministrador(): void {
    this.submitted = true;

    if (this.adminForm.invalid) {
      return;
    }

    const adminData = this.adminForm.value;

    if (this.formMode === 'crear') {
      this.administradorService.crearAdministrador(adminData)
        .subscribe({
          next: (admin) => {
            this.administradores.push(admin);
            this.filteredAdministradores = [...this.administradores];
            this.toggleFormMode('oculto');
            // Aquí se podría mostrar un mensaje de éxito
          },
          error: (err) => {
            console.error('Error al crear administrador', err);
            // Aquí se podría mostrar un mensaje de error
          }
        });
    } else {
      this.administradorService.actualizarAdministrador(adminData)
        .subscribe({
          next: (admin) => {
            const index = this.administradores.findIndex(a => a.id === admin.id);
            if (index !== -1) {
              this.administradores[index] = admin;
              this.filteredAdministradores = [...this.administradores];
            }
            this.toggleFormMode('oculto');
            // Aquí se podría mostrar un mensaje de éxito
          },
          error: (err) => {
            console.error('Error al actualizar administrador', err);
            // Aquí se podría mostrar un mensaje de error
          }
        });
    }
  }

  // Confirmar eliminación de un administrador
  confirmarEliminar(admin: Administrador): void {
    this.adminSeleccionado = admin;
    this.showDeleteModal = true;
  }

  // Eliminar administrador
  eliminarAdministrador(): void {
    if (!this.adminSeleccionado) return;

    this.administradorService.eliminarAdministrador(this.adminSeleccionado.id!)
      .subscribe({
        next: (success) => {
          if (success) {
            this.administradores = this.administradores.filter(a => a.id !== this.adminSeleccionado!.id);
            this.filteredAdministradores = [...this.administradores];
            this.showDeleteModal = false;
            this.adminSeleccionado = null;
            // Aquí se podría mostrar un mensaje de éxito
          }
        },
        error: (err) => {
          console.error('Error al eliminar administrador', err);
          // Aquí se podría mostrar un mensaje de error
        }
      });
  }

  // Filtrar administradores basados en el término de búsqueda
  onSearchChange(): void {
    if (!this.searchTerm) {
      this.filteredAdministradores = [...this.administradores];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredAdministradores = this.administradores.filter(admin =>
      admin.nombre.toLowerCase().includes(term) ||
      admin.apellido.toLowerCase().includes(term) ||
      admin.email.toLowerCase().includes(term) ||
      admin.rol.toLowerCase().includes(term)
    );
  }
}
