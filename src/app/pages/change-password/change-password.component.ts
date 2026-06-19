import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.error = 'Tous les champs sont obligatoires.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    this.loading = true;
    this.auth.changePassword({ oldPassword: this.oldPassword, newPassword: this.newPassword }).subscribe({
        next: () => {
  this.success = 'Mot de passe modifié avec succès.';
  this.loading = false;
  localStorage.setItem('mustChangePwd', 'false');
  setTimeout(() => this.router.navigate(['/dashboard']), 1500);
},

      error: (err: any) => {
        this.error = err.error?.message || 'Ancien mot de passe incorrect.';
        this.loading = false;
      }
    });
  }
}
