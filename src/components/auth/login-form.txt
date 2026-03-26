import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import Link from '@/components/ui/link';
import Form from '@/components/ui/forms/form';
import { Routes } from '@/config/routes';
import { useLogin } from '@/data/user';
import type { LoginInput } from '@/types';
import { useState } from 'react';
import Alert from '@/components/ui/alert';
import Router from 'next/router';
import { toast } from 'react-toastify';
import {
  allowedRoles,
  hasAccess,
  setAuthCredentials,
} from '@/utils/auth-utils';
import { useSearchParams } from "next/navigation";
const loginFormSchema = yup.object().shape({
  email: yup
    .string()
    .email('form:error-email-format')
    .required('form:error-email-required'),
  password: yup.string().required('form:error-password-required'),
});
const defaultValues = {
  email: "",
  password: "",
};

const LoginForm = () => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: login, isLoading, error } = useLogin();
  const searchParams = useSearchParams();
  const becomeSeller = searchParams.get("become_seller");
  function onSubmit(
    data: LoginInput,
    event?: React.BaseSyntheticEvent
  ) {
    event?.preventDefault(); // <-- empêche le rechargement

    login(
      { email: data.email, password: data.password },
      {
        onSuccess: (data) => {
          if (data?.token) {
            if (becomeSeller === "1") {
              toast.success(t('common:successfully-connexion-auth'));
            } else {
              toast.success(t('common:successfully-connexion'));
            }

            if (hasAccess(allowedRoles, data?.permissions)) {
              setAuthCredentials(data?.token, data?.permissions, data?.role);
              Router.push(Routes.dashboard);
              return;
            } else {
              Router.push(Routes.dashboard);
            }
            setErrorMessage('form:error-enough-permission');
          } else {
            setErrorMessage('form:error-credential-wrong');
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
    <>
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
              variant="outline"
              className="mb-4"
              error={t(errors?.email?.message!)}
            />
            <PasswordInput
              label={t('form:input-label-password')}
              forgotPassHelpText={t('form:input-forgot-password-label')}
              {...register('password')}
              error={t(errors?.password?.message!)}
              variant="outline"
              className="mb-4"
              forgotPageLink={Routes.forgotPassword}
            />
            <Button className="w-full" loading={isLoading} disabled={isLoading}>
              {t('form:button-label-login')}
            </Button>

            <div className="hidden relative mt-8 mb-6 flex flex-col items-center justify-center text-sm text-heading sm:mt-11 sm:mb-8">
              <hr className="w-full" />
              <span className="absolute -top-2.5 bg-light px-2 -ms-4 start-2/4">
                {t('common:text-or')}
              </span>
            </div>

            <div className="text-center text-sm text-body sm:text-base hindeed">
              {t('form:text-no-account')}{' '}
              <Link
                href="https://galileecommerce.vercel.app/register"
                className="font-semibold text-accent underline transition-colors duration-200 ms-1 hover:text-accent-hover hover:no-underline focus:text-accent-700 focus:no-underline focus:outline-none"
              >
                {t('form:link-register-shop-owner')}
              </Link>
            </div>
          </>
        )}
      </Form>
      {errorMessage ? (
        <Alert
          message={t(errorMessage)}
          variant="error"
          closeable={true}
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
    </>
  );
};

export default LoginForm;

{
  /* {errorMsg ? (
          <Alert
            message={t(errorMsg)}
            variant="error"
            closeable={true}
            className="mt-5"
            onClose={() => setErrorMsg('')}
          />
        ) : null} */
}
