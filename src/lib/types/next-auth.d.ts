import { Role, Department } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      department: Department;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    department: Department;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
    department: Department;
  }
}
