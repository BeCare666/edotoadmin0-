'use client';

import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import Checkbox from '@/components/ui/checkbox/checkbox';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import Form from '@/components/ui/forms/form';
import { useLogin } from '@/data/user';
import type { LoginInput } from '@/types';
import { useState } from 'react';
import Alert from '@/components/ui/alert';
import { toast } from 'react-toastify';
import {
  allowedRoles,
  hasAccess,
  setAuthCredentials,
} from '@/utils/auth-utils';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import Image from 'next/image';
import logo from '@/assets/logo/logo.png';

const loginFormSchema = yup.object().shape({
  email: yup
    .string()
    .email('form:error-email-format') 
    .required('form:error-email-required'),
  password: yup.string().required('form:error-password-required'),
});

const defaultValues = {
  email: '',
  password: '',
};

const LoginForm = () => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: login, isLoading } = useLogin();
  const searchParams = useSearchParams();
  const becomeSeller = searchParams.get('become_seller');
  const router = useRouter();

  function onSubmit(data: LoginInput, event?: React.BaseSyntheticEvent) {
    event?.preventDefault();

    login(
      { email: data.email, password: data.password },
      {
        onSuccess: (data) => {
          if (!data?.token) {
            setErrorMessage('form:error-credential-wrong');
            return;
          }

          if (becomeSeller === '1') {
            toast.success(t('common:successfully-connexion-auth'));
          } else {
            toast.success(t('common:successfully-connexion'));
          }

          setAuthCredentials(data?.token, data?.permissions ?? [], data?.role);

          if (data?.redirect) {
            router.push('/');
            return;
          }

          const allowed = hasAccess(allowedRoles, data?.permissions ?? []);
          if (!allowed) {
            setErrorMessage('form:error-enough-permission');
          }
        },
        onError: (error: any) => {
          console.error('Erreur pendant la connexion:', error);
          if (error?.response?.data?.message) {
            setErrorMessage(error.response.data.message);
          } else if (error?.message) {
            setErrorMessage(error.message);
          } else {
            setErrorMessage('form:error-something-wrong');
          }
        },
      }
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffe4ef] via-[#fff0f5] to-[#fff5f8] px-4 py-12 relative overflow-hidden">
      {/* Orbes décoratives */}
      <div className="absolute top-[-120px] left-[-100px] w-72 h-72 bg-[#FF6EA9]/30 rounded-full blur-3xl animate-bounce-slow" />
      <div className="absolute bottom-[-120px] right-[-100px] w-96 h-96 bg-[#FF6EA9]/40 rounded-full blur-3xl animate-bounce-slow-reverse" />

      <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-lg px-8 pt-20 pb-10">
        {/* Logo flottant */}
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white p-3 rounded-full shadow-lg border border-white/40">
          <Image
            src={logo}
            alt="Logo"
            width={70}
            height={70}
            className="rounded-full object-cover"
          />
        </div>

        <h1 className="text-2xl font-bold text-[#0F172A] mt-2 text-center">
          Administration<span className="text-[#FF6EA9]"> E·Doto Family</span>
        </h1>
        <p className="text-gray-500 mt-2 mb-8 text-sm text-center">
          Connectez-vous à l'espace admin
        </p>

        {errorMessage && (
          <Alert
            message={t(errorMessage)}
            variant="error"
            closeable
            className="mb-5"
            onClose={() => setErrorMessage(null)}
          />
        )}

        <Form<LoginInput>
          validationSchema={loginFormSchema}
          onSubmit={onSubmit}
          useFormProps={{ defaultValues }}
        >
          {({ register, formState: { errors } }) => (
            <>
              <Input
                label={t('form:input-label-email')}
                {...register('email')}
                type="email"
                autoComplete="email"
                variant="outline"
                className="mb-5 border-gray-200 transition-shadow focus:ring-2 focus:ring-[#FF6EA9]/30 focus:border-[#FF6EA9]"
                error={t(errors?.email?.message!)}
              />

              <PasswordInput
                label={t('form:input-label-password')}
                forgotPassHelpText=""
                forgotPageLink=""
                {...register('password')}
                autoComplete="current-password"
                error={t(errors?.password?.message!)}
                variant="outline"
                className="mb-5 border-gray-200"
              />

              <div className="mb-6 flex items-center">
                <Checkbox
                  id="remember"
                  name="remember"
                  label={t('form:input-label-remember-me')}
                  className="text-sm text-body"
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full font-medium shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-[#FF6EA9] focus:ring-offset-2"
                loading={isLoading}
                disabled={isLoading}
              >
                {t('form:button-label-login')}
              </Button>
            </>
          )}
        </Form>

        <p className="text-gray-500 text-sm mt-6 text-center">
          Pas encore de compte ?{' '}
          <a
            href="/register"
            className="text-[#FF6EA9] font-medium hover:underline"
          >
            Créez-en un
          </a>
        </p>
      </div>
    </main>
  );
};

export default LoginForm;