import { isPathProtected } from '@/app/paths';
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Credentials({
      async authorize({ email, password }) {
        // Проверяем, совпадают ли email и пароль с .env
        if (
          process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email &&
          process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === password
        ) {
          const user: User = { email, name: 'Admin User' }; 
          return user; // Успешная аутентификация
        } else {
          return null; // Ошибка аутентификации
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl; 
      const isUrlProtected = isPathProtected(pathname); // Проверяем путь
      const isUserLoggedIn = !!auth?.user; // Есть ли сессия?
      const isRequestAuthorized = !isUrlProtected || isUserLoggedIn;

      return isRequestAuthorized; // Разрешить/запретить доступ
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});

export const runAuthenticatedAdminServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  if (session?.user) {
    return callback();
  } else {
    throw new Error('Неавторизованный доступ');
  }
};
