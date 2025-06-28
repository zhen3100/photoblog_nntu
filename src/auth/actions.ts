'use server';

import {
  auth,
  signIn,
  signOut,
} from '@/auth/server';
import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';
import {
  generateAuthSecret,
  KEY_CALLBACK_URL,
  KEY_CREDENTIALS_CALLBACK_ROUTE_ERROR_URL,
  KEY_CREDENTIALS_SIGN_IN_ERROR,
  KEY_CREDENTIALS_SIGN_IN_ERROR_URL,
  KEY_CREDENTIALS_SUCCESS,
} from '.';


/*
Метод signInAction
Обрабатывает вход пользователя с помощью credentials (логин/пароль)
*/

export const signInAction = async (
  _prevState: string | undefined,
  formData: FormData,
) => {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if (
      // Обработка ошибок аутентификации
      `${error}`.includes(KEY_CREDENTIALS_SIGN_IN_ERROR) || 
      `${error}`.includes(KEY_CREDENTIALS_SIGN_IN_ERROR_URL) ||
      `${error}`.includes(KEY_CREDENTIALS_CALLBACK_ROUTE_ERROR_URL)
    ) {
      return KEY_CREDENTIALS_SIGN_IN_ERROR;
    } else if (!`${error}`.includes('NEXT_REDIRECT')) {
      console.log('Ошибка при входе:', {   
        errorText: `${error}`,
        error,
      });
      throw error;
    }
  }
  if (formData.get(KEY_CALLBACK_URL)) {
    redirect(formData.get(KEY_CALLBACK_URL) as string);
  }
  return KEY_CREDENTIALS_SUCCESS; // Перенаправление после успешного входа
};

export const signOutAction = async () =>
  signOut({ redirect: false });

export const getAuthAction = async () => auth();

export const logClientAuthUpdate = async (data: Session | null | undefined) =>
  console.log('Client auth update', data);

export const generateAuthSecretAction = async () => generateAuthSecret();
