import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf
  ],
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    setTimeout(() => {
      this.authService.iniciarSesion(email, password)
        .subscribe({
          next: () => {
            // 1) Navega al Home...
            this.router.navigate(['/home'])
              .then(navigated => {
                if (navigated) {
                  // 2) Cuando ya estés en /home, recarga la página
                  window.location.reload();
                } else {
                  // Si falló la navegación, igualmente quita el loader
                  this.isLoading = false;
                }
              });
          },
          error: (error) => {
            // En caso de error, quita el loader y muestra mensaje
            this.isLoading = false;
            if (error.status === 401) {
              this.errorMessage = 'Credenciales incorrectas. Por favor, inténtalo de nuevo.';
            } else {
              this.errorMessage = 'Error al conectar con el servidor. Por favor, inténtalo más tarde.';
            }
          }
        });
    }, 3000);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
