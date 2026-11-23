
export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface AuthUser {
    user_id: string;
    name: string;
    lastname: string;
    email: string;
    role: 'students' | 'staff' | 'referents' | 'none';
  }
  
  export interface MeResponse {
    user: AuthUser;
  }
  
  export interface LoginResponse {
    user: AuthUser;
    csrfToken: string;
  }
  
  export interface RegisterRequest {
    name: string;
    lastname: string;
    email: string;
    password1: string;
    password2: string;
    role: 1 | 2 | 3;
  }
  
  export interface RegisterResponse {
    user_id: number;
    name: string;
    lastname: string;
    email: string;
    role: string;
  }
  