import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Routes } from '@/config/routes';
import { useTranslation } from 'next-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from '@/components/ui/link';
import {
  allowedRoles,
  hasAccess,
  setAuthCredentials,
} from '@/utils/auth-utils';
import { Permission } from '@/types';
import { useRegisterMutation } from '@/data/user';
import { birthDateRule, emailRule, nameInput, nameRule, passwordInput, passwordRule, PASSWORD_RULES, SEX_OPTIONS, sexRule } from '@/utils/field-rules';
import { authButtonClass, authInputClass, authLabelClass, authLinkClass } from '@/components/auth/edoto-auth-shell';

type FormValues = {
  name: string;
  email: string;
  password: string;
  birth_date: string;
  sex: string;
  permission: Permission;
};
// Mêmes règles que le site et l'API (16/10/2026)
const registrationFormSchema = yup.object().shape({
  name: nameRule('Le nom'),
  email: emailRule(),
  password: passwordRule(),
  birth_date: birthDateRule(),
  sex: sexRule(),
  permission: yup.string().default('store_owner').oneOf(['store_owner']),
});
const RegistrationForm = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: registerUser, isLoading: loading } = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(registrationFormSchema),
    defaultValues: {
      permission: Permission.StoreOwner,
    },
  });
  const router = useRouter();
  const { t } = useTranslation();

  const passwordValue = watch('password') || '';
  const sexValue = watch('sex');

  async function onSubmit({ name, email, password, birth_date, sex, permission }: FormValues) {
    registerUser(
      {
        name,
        email,
        password,
        birth_date,
        sex,
        //@ts-ignore
        permission,
      },

      {
        onSuccess: (data) => {
          if (data?.token) {
            if (hasAccess(allowedRoles, data?.permissions)) {
              setAuthCredentials(data?.token, data?.permissions, data?.role);
              router.push(Routes.dashboard);
              return;
            }
            setErrorMessage('form:error-enough-permission');
          } else {
            setErrorMessage('form:error-credential-wrong');
          }
        },
        onError: (error: any) => {
          // Message de l'API (contrôle des champs) affiché tel quel
          const msg = error?.response?.data?.message;
          if (msg) {
            setErrorMessage(Array.isArray(msg) ? msg.join(' ') : String(msg));
            return;
          }
          Object.keys(error?.response?.data ?? {}).forEach((field: any) => {
            setError(field, {
              type: 'manual',
              message: error?.response?.data[field],
            });
          });
        },
      },
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(
          //@ts-ignore
          onSubmit,
        )}
        noValidate
      >
        <Input
          label={t('form:input-label-name')}
          {...register('name', { onChange: (e) => setValue('name', nameInput(e.target.value)) })}
          variant="outline"
          className="mb-4"
          labelClassName={authLabelClass}
          inputClassName={authInputClass}
          error={t(errors?.name?.message!)}
        />
        <Input
          label={t('form:input-label-email')}
          {...register('email')}
          type="email"
          variant="outline"
          className="mb-4"
          labelClassName={authLabelClass}
          inputClassName={authInputClass}
          error={t(errors?.email?.message!)}
        />
        <Input
          label="Date de naissance"
          {...register('birth_date')}
          type="date"
          variant="outline"
          className="mb-4"
          labelClassName={authLabelClass}
          inputClassName={authInputClass}
          error={t(errors?.birth_date?.message!)}
        />
        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-medium text-[#3D3934]">Sexe</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {SEX_OPTIONS.map((o) => {
              const on = sexValue === o.value;
              return (
                <label key={o.value} className={`flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition ${on ? 'border-[#C2185B] bg-[#FBEEF3]' : 'border-[#E6E2DC] hover:border-[#C9C3BA]'}`}>
                  <input type="radio" value={o.value} {...register('sex')} className="sr-only" />
                  <span className={`text-[15px] font-medium ${on ? 'text-[#A0124A]' : 'text-[#1A1814]'}`}>{o.label}</span>
                  <span className="text-[12.5px] text-[#8A837A]">{o.hint}</span>
                </label>
              );
            })}
          </div>
          {errors?.sex?.message && <p className="my-2 text-xs text-red-500">{t(errors.sex.message as string)}</p>}
        </fieldset>
        <PasswordInput
          label={t('form:input-label-password')}
          {...register('password', { onChange: (e) => setValue('password', passwordInput(e.target.value)) })}
          error={t(errors?.password?.message!)}
          variant="outline"
          className="mb-2"
          labelClassName="text-sm font-medium leading-none text-[#3D3934]"
          inputClassName={authInputClass}
        />
        <ul className="mb-5 grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Règles du mot de passe">
          {PASSWORD_RULES.map((r) => (
            <li key={r.key} className={`text-[12.5px] ${r.test(passwordValue) ? 'text-[#2F5D3A]' : 'text-[#8A837A]'}`}>
              {r.test(passwordValue) ? '✓' : '○'} {r.label}
            </li>
          ))}
        </ul>
        <Button className={authButtonClass} loading={loading} disabled={loading}>
          {t('form:text-register')}
        </Button>

        {errorMessage ? (
          <Alert
            message={t(errorMessage)}
            variant="error"
            closeable={true}
            className="mt-5"
            onClose={() => setErrorMessage(null)}
          />
        ) : null}
      </form>
      <div className="relative flex flex-col items-center justify-center mt-8 mb-6 text-sm text-heading sm:mt-11 sm:mb-8">
        <hr className="w-full" />
        <span className="start-2/4 -ms-4 absolute -top-2.5 bg-light px-2">
          {t('common:text-or')}
        </span>
      </div>
      <div className="text-sm text-center text-body sm:text-base">
        {t('form:text-already-account')}{' '}
        <Link
          href={Routes.login}
          className={`ms-1 ${authLinkClass}`}
        >
          {t('form:button-label-login')}
        </Link>
      </div>
    </>
  );
};

export default RegistrationForm;
