export type UserRole = 1 | 2 | 3;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  lastname: string;
  email: string;
  password1: string;
  password2: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  user_id: number | string;
  name: string;
  lastname: string;
  email: string;
  role: 'students' | 'referents' | 'staff' | 'none';
}

export interface LoginResponse {
  user: AuthenticatedUser;
  csrfToken: string;
}
