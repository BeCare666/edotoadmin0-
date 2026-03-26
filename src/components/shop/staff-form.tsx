import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import PasswordInput from '@/components/ui/password-input';
import { useForm } from 'react-hook-form';
import Card from '@/components/common/card';
import Description from '@/components/ui/description';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useShopQuery } from '@/data/shop';
import { useAddStaffMutation } from '@/data/staff';
import { passwordRules } from '@/utils/constants';
import StickyFooterPanel from '@/components/ui/sticky-footer-panel';
import { toast } from 'react-toastify';

type FormValues = {
  name: string;
  email: string;
  password: string;
};

const staffFormSchema = yup.object().shape({
  name: yup.string().required('form:error-name-required'),
  email: yup
    .string()
    .email('form:error-email-format')
    .required('form:error-email-required'),
  password: yup
    .string()
    .required('form:error-password-required')
    .matches(passwordRules, {
      message: 'form:error-password-weak',
    }),
});

const AddStaffForm = () => {
  const router = useRouter();
  const {
    query: { shop },
  } = router;

  const { t } = useTranslation();

  const { data: shopData } = useShopQuery({
    slug: shop as string,
  });

  const shopId = shopData?.id;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(staffFormSchema),
  });

  const { mutate: addStaff, isLoading: loading } = useAddStaffMutation();

  function onSubmit({ name, email, password }: FormValues) {
    if (!shopId) {
      toast.error(t('form:error-shop-not-found'));
      return;
    }

    addStaff(
      {
        name,
        email,
        password,
        shop_id: Number(shopId),
      },
      {
        onSuccess: () => {
          toast.success(t('form:success-staff-created'));
          reset();
          router.push({
            pathname: '/[shop]/staffs',
            query: { shop },
          });
        },

        onError: (error: any) => {
          const status = error?.response?.status;
          const data = error?.response?.data;

          // 🔴 Validation erreurs champ par champ
          if (status === 422 && data?.errors) {
            Object.entries(data.errors).forEach(([field, message]) => {
              setError(field as keyof FormValues, {
                type: 'manual',
                message: message as string,
              });
            });

            toast.error(t('form:error-invalid-fields'));
            return;
          }

          // 🔴 Email déjà existant
          if (status === 400 && data?.message === 'EMAIL_ALREADY_EXISTS') {
            setError('email', {
              type: 'manual',
              message: 'form:error-email-exists',
            });

            toast.error(t('form:error-email-exists'));
            return;
          }

          // 🔴 Boutique introuvable
          if (status === 404 && data?.message === 'SHOP_NOT_FOUND') {
            toast.error(t('form:error-shop-not-found'));
            return;
          }

          // 🔴 Accès interdit
          if (status === 403) {
            toast.error(t('form:error-unauthorized'));
            return;
          }

          // 🔴 Erreur serveur
          toast.error(t('form:error-server'));
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="my-5 flex flex-wrap sm:my-8">
        <Description
          title={t('form:form-title-information')}
          details={t('form:form-description-staff-info')}
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full sm:w-8/12 md:w-2/3">
          <Input
            label={t('form:input-label-name')}
            {...register('name')}
            type="text"
            variant="outline"
            className="mb-4"
            error={t(errors.name?.message!)}
            required
          />

          <Input
            label={t('form:input-label-email')}
            {...register('email')}
            type="email"
            variant="outline"
            className="mb-4"
            error={t(errors.email?.message!)}
            required
          />

          <PasswordInput
            label={t('form:input-label-password')}
            {...register('password')}
            error={t(errors.password?.message!)}
            variant="outline"
            className="mb-4"
            required
          />
        </Card>
      </div>

      <StickyFooterPanel>
        <div className="text-end">
          <Button
            loading={loading}
            disabled={loading}
            className="text-sm md:text-base"
          >
            {t('form:button-label-add-staff')}
          </Button>
        </div>
      </StickyFooterPanel>
    </form>
  );
};

export default AddStaffForm;
