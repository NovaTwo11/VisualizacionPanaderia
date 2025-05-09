import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Cliente } from '../../../models/models';
import { ClienteService } from '../../../services/cliente.service';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {SearchBarComponent} from '../../../shared/search-bar/search-bar.component';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SearchBarComponent],
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
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  filteredClientes: Cliente[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Formulario
  clienteForm: FormGroup;
  formMode: 'crear' | 'editar' | 'oculto' = 'oculto';
  submitted: boolean = false;

  // Modal de eliminación
  showDeleteModal: boolean = false;
  clienteSeleccionado: Cliente | null = null;

  // Búsqueda
  searchTerm: string = '';

  constructor(
    private clienteService: ClienteService,
    private formBuilder: FormBuilder
  ) {
    this.clienteForm = this.formBuilder.group({
      id: [null],
      nombre: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      apellido: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{7,10}$')
      ]],
      direccion: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.getClientes();

    // Suscribirse a cambios en el término de búsqueda
    this.onSearchChange();
  }

  // Getter para acceder fácilmente a los controles del formulario
  get f() { return this.clienteForm.controls; }

  getClientes(): void {
    this.loading = true;
    this.clienteService.getClientes()
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes;
          this.filteredClientes = [...clientes];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar clientes', err);
          this.error = 'Error al cargar los clientes. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
  }

  toggleFormMode(mode: 'crear' | 'editar' | 'oculto'): void {
    this.formMode = mode;
    this.submitted = false;

    if (mode === 'crear') {
      this.clienteForm.reset({
        activo: true
      });
    }
  }

  editarCliente(cliente: Cliente): void {
    this.clienteForm.patchValue({
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      activo: cliente.activo
    });

    this.toggleFormMode('editar');
  }

  guardarCliente(): void {
    this.submitted = true;

    if (this.clienteForm.invalid) {
      return;
    }

    const clienteData = this.clienteForm.value;

    if (this.formMode === 'crear') {
      this.clienteService.crearCliente(clienteData)
        .subscribe({
          next: (cliente) => {
            this.clientes.push(cliente);
            this.filteredClientes = [...this.clientes];
            this.toggleFormMode('oculto');
            // Aquí se podría mostrar un mensaje de éxito
          },
          error: (err) => {
            console.error('Error al crear cliente', err);
            // Aquí se podría mostrar un mensaje de error
          }
        });
    } else {
      this.clienteService.actualizarCliente(clienteData)
        .subscribe({
          next: (cliente) => {
            const index = this.clientes.findIndex(c => c.id === cliente.id);
            if (index !== -1) {
              this.clientes[index] = cliente;
              this.filteredClientes = [...this.clientes];
            }
            this.toggleFormMode('oculto');
            // Aquí se podría mostrar un mensaje de éxito
          },
          error: (err) => {
            console.error('Error al actualizar cliente', err);
            // Aquí se podría mostrar un mensaje de error
          }
        });
    }
  }

  confirmarEliminar(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.showDeleteModal = true;
  }

  eliminarCliente(): void {
    if (!this.clienteSeleccionado) return;

    this.clienteService.eliminarCliente(this.clienteSeleccionado.id)
      .subscribe({
        next: (success) => {
          if (success) {
            this.clientes = this.clientes.filter(c => c.id !== this.clienteSeleccionado!.id);
            this.filteredClientes = [...this.clientes];
            this.showDeleteModal = false;
            this.clienteSeleccionado = null;
            // Aquí se podría mostrar un mensaje de éxito
          }
        },
        error: (err) => {
          console.error('Error al eliminar cliente', err);
          // Aquí se podría mostrar un mensaje de error
        }
      });
  }

  onSearchChange(): void {
    // Filtrar clientes basado en el término de búsqueda
    if (!this.searchTerm) {
      this.filteredClientes = [...this.clientes];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredClientes = this.clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(term) ||
      cliente.apellido.toLowerCase().includes(term) ||
      cliente.email.toLowerCase().includes(term) ||
      cliente.telefono.includes(term)
    );
  }
}
