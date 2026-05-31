import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;
  showPassword = false;
  returnUrl = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  login() {
    if (!this.username || !this.password) {
      this.error = 'Por favor, preencha todos os campos.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        console.error('Login Error:', err);
        this.error = 'Erro: ' + (err.error?.message || err.message || 'Falha desconhecida');
        this.loading = false;
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}


