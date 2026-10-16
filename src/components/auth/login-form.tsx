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
import EdotoAuthShell, { authButtonClass, authInputClass, authLabelClass, authLinkClass } from '@/components/auth/edoto-auth-shell';

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

  // Même cadre et même logo que le site (16/10/2026) ; textes inchangés
  return (
    <EdotoAuthShell
      title="Administration E.doto family"
      subtitle="Connectez-vous à l'espace admin"
      footer={
        <p>
          Pas encore de compte ?{' '}
          <a href="/register" className={authLinkClass}>
            Créez-en un
          </a>
        </p>
      }
    >
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
                className="mb-5"
                labelClassName={authLabelClass}
                inputClassName={authInputClass}
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
                className="mb-5"
                labelClassName="text-sm font-medium leading-none text-[#3D3934]"
                inputClassName={authInputClass}
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
                className={authButtonClass}
                loading={isLoading}
                disabled={isLoading}
              >
                {t('form:button-label-login')}
              </Button>
            </>
          )}
        </Form>

    </EdotoAuthShell>
  );
};

export default LoginForm;