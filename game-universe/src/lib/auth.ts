import { AuthOptions, Account, User as DefaultUser, Session } from 'next-auth'; // Added Session import
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { JWT } from 'next-auth/jwt';

if (!process.env.GITHUB_ID) throw new Error('GITHUB_ID is not set');
if (!process.env.GITHUB_SECRET) throw new Error('GITHUB_SECRET is not set');
if (!process.env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID is not set');
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error('GOOGLE_CLIENT_SECRET is not set');
if (!process.env.NEXTAUTH_SECRET) throw new Error('NEXTAUTH_SECRET is not set');

// Define a custom User type to include 'id' and 'role'
// DefaultUser already includes name, email, and image.
interface CustomUser extends DefaultUser {
    id: string;
    role: UserRole;
}

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    throw new Error('Please enter email and password.');
                }
                const user = await prisma.user.findUnique({ where: { email: credentials.email } });
                if (!user || !user.password) {
                    throw new Error('Invalid credentials.');
                }
                const isValidPassword = await bcrypt.compare(credentials.password, user.password);
                if (!isValidPassword) {
                    throw new Error('Invalid credentials.');
                }
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                };
            },
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user, account, trigger }: {
            token: JWT;
            user?: DefaultUser;
            account?: Account | null;
            trigger?: 'signIn' | 'signUp' | 'update';
        }) {
            if (user) {
                const customUser = user as CustomUser;
                token.id = customUser.id;
                token.role = customUser.role;
                token.name = customUser.name;
                token.email = customUser.email;
                token.image = customUser.image;
            }

            if (trigger === 'update' && token.id) {
                const latestUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: {
                        name: true,
                        email: true,
                        image: true,
                        role: true,
                    },
                });

                if (latestUser) {
                    token.name = latestUser.name;
                    token.email = latestUser.email;
                    token.image = latestUser.image;
                    token.role = latestUser.role;
                }
            }

            if (account) {
                token.provider = account.provider;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) { // Changed 'any' to 'Session'
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                session.user.provider = token.provider as string;
                session.user.name = token.name as string | null | undefined;
                session.user.email = token.email as string | null | undefined;
                session.user.image = token.image as string | null | undefined;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
