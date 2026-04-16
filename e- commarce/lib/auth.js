
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";
import { sendSecurityAlertEmail } from "@/lib/email";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                // ───── MASTER ADMIN FALLBACK ─────
                // This allows the site owner to login even if database is down or empty.
                const masterEmail = process.env.ADMIN_EMAIL;
                const masterPass = process.env.ADMIN_PASSWORD;

                if (masterEmail && masterPass && credentials.email === masterEmail && credentials.password === masterPass) {
                    console.log("[Auth] Master Admin Login Successful:", masterEmail);
                    return {
                        id: "master-admin",
                        name: "Super Admin",
                        email: masterEmail,
                        role: "ADMIN"
                    };
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isCorrectPassword) {
                    throw new Error("Invalid credentials");
                }

                return user;
            }
        })
    ],
    events: {
        async signIn({ user }) {
            if (user?.role === "ADMIN") {
                // Log the admin login
                await createAuditLog({
                    adminId: user.id || user.email,
                    action: "LOGIN",
                    entityType: "User",
                    entityId: user.id,
                    meta: { email: user.email, timestamp: new Date() }
                });

                // Send email alert to super-admin
                await sendSecurityAlertEmail({
                    user,
                    action: "Admin Login Detected",
                    details: `Admin account (${user.email}) logged in at ${new Date().toLocaleString()}`
                });
            }
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};
