import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Producto } from '../../../models/models';
import { ProductoService } from '../../../services/producto.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchBarComponent } from '../../../shared/search-bar/search-bar.component';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SearchBarComponent, ReactiveFormsModule],
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
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  categorias: string[] = [];
  filteredProductos: Producto[] = [];
  loading = true;
  error: string | null = null;

  productoForm: FormGroup;
  formMode: 'crear' | 'editar' | 'oculto' = 'oculto';
  submitted = false;

  showDeleteModal = false;
  productoSeleccionado: Producto | null = null;

  selectedFile: File | null = null;
  uploadingImage = false;
  imagenUrls: { [key: number]: string } = {};

  searchTerm = '';
  filtroCategoria = 'todos';

  constructor(
    private productoService: ProductoService,
    private formBuilder: FormBuilder
  ) {
    this.productoForm = this.formBuilder.group({
      id: [null],
      nombre: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      descripcion: ['', [
        Validators.required,
        Validators.minLength(5)
      ]],
      precio: [0, [
        Validators.required,
        Validators.min(0.01)
      ]],
      categoria: ['', Validators.required],
      stock: [0, [
        Validators.required,
        Validators.min(0)
      ]],
      imagen: [''],
      disponible: [true]
    });
  }

  ngOnInit(): void {
    this.getProductos();
  }

  get f() {
    return this.productoForm.controls;
  }

  getProductos(): void {
    this.loading = true;
    this.error = null;
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.filteredProductos = [...productos];
        this.categorias = Array.from(new Set(productos.map(p => p.categoria)));
        this.loading = false;
        this.cargarImagenes();
        console.log('Productos con stock:', this.productos);
      },
      error: (err) => {
        console.error('Error al cargar productos', err);
        this.error = 'Error al cargar los productos. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }
  cargarImagenes(): void {
    this.productos.forEach(prod => {
      this.productoService.getImage(prod.id!).subscribe(blob => {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagenUrls[prod.id!] = reader.result as string;
        };
        reader.readAsDataURL(blob);
      });
    });
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  toggleFormMode(mode: 'crear' | 'editar' | 'oculto'): void {
    this.formMode = mode;
    this.submitted = false;
    this.selectedFile = null;

    if (mode === 'crear') {
      this.productoForm.reset({
        precio: 0,
        stock: 0,
        disponible: true
      });
    }
  }

  editarProducto(producto: Producto): void {
    this.productoForm.patchValue({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      stock: producto.stock,
      imagen: producto.imagen,
      disponible: producto.disponible
    });
    this.toggleFormMode('editar');
  }

  guardarProducto(): void {
    this.submitted = true;
    if (this.productoForm.invalid) {
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.f['nombre'].value);
    formData.append('descripcion', this.f['descripcion'].value);
    formData.append('precio', this.f['precio'].value.toString());
    formData.append('categoria', this.f['categoria'].value);
    formData.append('stock', this.f['stock'].value.toString());
    formData.append('disponible', this.f['disponible'].value.toString());

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    const id = this.f['id'].value;
    const esCrear = this.formMode === 'crear';
    this.uploadingImage = true;

    const request$ = esCrear
      ? this.productoService.crearProductoFormData(formData)
      : this.productoService.actualizarProductoFormData(formData, id);

    request$.subscribe({
      next: (producto: Producto) => {
        if (esCrear) {
          this.productos.push(producto);
        } else {
          const index = this.productos.findIndex(p => p.id === producto.id);
          if (index !== -1) this.productos[index] = producto;
        }
        this.filtrarProductos();
        this.toggleFormMode('oculto');
        this.uploadingImage = false;
      },
      error: (err) => {
        console.error('Error al guardar producto', err);
        this.uploadingImage = false;
      }
    });
  }

  confirmarEliminar(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.showDeleteModal = true;
  }

  eliminarProducto(): void {
    if (!this.productoSeleccionado) return;
    this.productoService.eliminarProducto(this.productoSeleccionado.id)
      .subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.id !== this.productoSeleccionado!.id);
          this.filtrarProductos();
          this.showDeleteModal = false;
          this.productoSeleccionado = null;
        },
        error: (err) => console.error('Error al eliminar producto', err)
      });
  }

  onSearchChange(): void {
    this.filtrarProductos();
  }

  filtrarProductos(): void {
    let filtered = [...this.productos];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.descripcion.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term)
      );
    }
    if (this.filtroCategoria !== 'todos') {
      filtered = filtered.filter(p => p.categoria === this.filtroCategoria);
    }
    this.filteredProductos = filtered;
  }
}
