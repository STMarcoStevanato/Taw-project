import * as userRepository from "../repositories/user.repository";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { UserWithRole, LoginResponse } from "../types/user";


dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;

export const createUser = async (name: string, lastname: string, email: string, password: string, role: number) => {

  const roleTableMap = {
  1: "students",
  2: "referents",
  3: "staff",
  } as const;

  const roleTableName = roleTableMap[role as keyof typeof roleTableMap];

  if (!roleTableName) {
    const error = new Error("Invalid user role") as any;
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await userRepository.findUserByEmail(email);
  if (existingUser) {
    const error = new Error("Email already registered") as any;
    error.statusCode = 409; 
    throw error;
  }
  
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  return await userRepository.createUser(name, lastname, email, hashedPassword, roleTableName);
};

export const login = async (email: string, password: string): Promise<LoginResponse> => {

  const user = await userRepository.findUserByEmailWithRole(email);
  if (!user) {
    const error = new Error("Invalid email or password") as any;
    error.statusCode = 401; 
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password") as any;
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: "2h" }
  );

  return {
    user: {
      user_id: user.user_id, 
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role as "students" | "staff" | "referents" | "none"
    },
    token
  };
}


export const getReferents = async (): Promise<UserWithRole[]> => {
  return await userRepository.getReferents();
};