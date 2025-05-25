// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AdapterUser } from "next-auth/adapters";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: UserRole;
            provider?: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        id: string;
        role: UserRole;
    }
}
declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: UserRole;
        provider?: string;
    }
}

declare module "next-auth/adapters" {
    interface AdapterUser {
        role: UserRole;
    }
}
