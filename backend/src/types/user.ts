export interface UserWithRole {
  user_id: number;          
  name: string;
  lastname: string;
  email: string;
  role: "students" | "staff" | "referents" | "none";
}

export interface LoginResponse {
  user: UserWithRole;
  token: string;
}