import { createContext } from "react"

export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  fullName: string;
  storeName: string;
  phoneNumber: string;
  role: UserRole;
}

export interface SignupData {
  fullName: string;
  storeName: string;
  phoneNumber: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  setUserRole: (role: UserRole) => void;
  updateUser: (userData: Partial<User>) => void;
  resetRoleSelection: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  needsRoleSelection: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)