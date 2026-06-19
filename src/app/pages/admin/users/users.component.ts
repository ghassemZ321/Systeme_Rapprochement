import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { UserResponse, CreateUserRequest } from '../../../models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: UserResponse[] = [];
  loading = true;
  saving = false;
  showForm = false;
  error = '';
  success = '';

  newUser: CreateUserRequest = {
    username: '',
    fullName: '',
    role: 'AGENT',
    password: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (u: UserResponse[]) => { this.users = u; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  createUser(): void {
    if (!this.newUser.username || !this.newUser.fullName || !this.newUser.password) {
      this.error = 'Tous les champs sont obligatoires.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.api.createUser(this.newUser).subscribe({
      next: () => {
        this.success = `Utilisateur ${this.newUser.username} créé avec succès.`;
        this.saving = false;
        this.showForm = false;
        this.newUser = { username: '', fullName: '', role: 'AGENT', password: '' };
        this.loadUsers();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors de la création.';
        this.saving = false;
      }
    });
  }

  toggleUser(userId: number, currentActive: number): void {
    this.api.toggleUser(userId).subscribe({
      next: () => {
        this.success = `Utilisateur ${currentActive === 1 ? 'désactivé' : 'activé'} avec succès.`;
        this.loadUsers();
      },
      error: () => { this.error = 'Erreur lors de la modification.'; }
    });
  }

  resetPassword(userId: number, username: string): void {
    if (!confirm(`Réinitialiser le mot de passe de ${username} ?`)) return;
    this.api.resetPassword(userId).subscribe({
      next: () => { this.success = `Mot de passe de ${username} réinitialisé.`; },
      error: () => { this.error = 'Erreur lors de la réinitialisation.'; }
    });
  }

  getRoleBadge(role: string): string {
    switch (role) {
      case 'ADMIN': return 'badge badge-admin';
      case 'SUPERVISEUR': return 'badge badge-superviseur';
      case 'AGENT': return 'badge badge-agent';
      default: return 'badge';
    }
  }

  isActive(user: UserResponse): boolean {
    return user.active === 1;
  }
}
