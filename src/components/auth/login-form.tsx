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
import TotpStep from '@/components/auth/totp-step';

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
  const [siteSpace, setSiteSpace] = useState<{ path: string; label: string } | null>(null);
  const { mutate: login, isLoading } = useLogin();
  const searchParams = useSearchParams();
  const becomeSeller = searchParams.get('become_seller');
  const router = useRouter();
  // Double authentification (audit 3.1) : défi renvoyé par POST /token à la place de la session
  const [totp, setTotp] = useState<{ challenge: string; setup_required: boolean } | null>(null);

  function onSubmit(data: LoginInput, event?: React.BaseSyntheticEvent) {
    event?.preventDefault();

    login(
      { email: data.email, password: data.password },
      {
        onSuccess: (data: any) => {
          if (data?.totp_required && data?.challenge) {
            setErrorMessage(null);
            setTotp({ challenge: data.challenge, setup_required: !!data.setup_required });
            return;
          }
          finishLogin(data);
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

  // Session reçue (directement ou après le code de double authentification)
  function finishLogin(data: any) {
          if (!data?.token) {
            setErrorMessage('form:error-credential-wrong');
            return;
          }

          // Comptes dont l'espace est sur le site (sponsor, point de retrait, médecin, centre) : la session
          // n'est plus enregistrée dans l'admin (19/10/2026), le compte est orienté vers son espace.
          const allowed = hasAccess(allowedRoles, data?.permissions ?? []);
          if (!allowed) {
            const perms: string[] = data?.permissions ?? [];
            const siteSpace = perms.includes('sponsor')
              ? { path: '/sponsor', label: 'votre espace sponsor' }
              : perms.includes('super_pickuppoint')
                ? { path: '/pickup-dashboard', label: 'votre dashboard point de retrait' }
                : perms.includes('doctor')
                  ? { path: '/medecin', label: 'votre espace médecin' }
                  : perms.includes('health_center')
                    ? { path: '/centre', label: 'votre espace centre' }
                    : null;
            setSiteSpace(siteSpace);
            setErrorMessage(
              siteSpace
                ? `Ce compte se connecte sur le site E.doto family, dans ${siteSpace.label}.`
                : 'form:error-enough-permission',
            );
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
        {errorMessage && siteSpace && (
          <a
            href={`${process.env.NEXT_PUBLIC_SHOP_URL || 'https://edotofamily.com'}/login`}
            className={`mb-5 -mt-2 block text-sm ${authLinkClass}`}
          >
            Se connecter sur le site E.doto family
          </a>
        )}

        {totp ? (
          <TotpStep
            challenge={totp}
            onSession={(session) => {
              setTotp(null);
              finishLogin(session);
            }}
            onCancel={() => setTotp(null)}
          />
        ) : (
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
        )}

    </EdotoAuthShell>
  );
};

export default LoginForm;