import SelectInput from '@/components/ui/select-input';
import Label from '@/components/ui/label';
import ValidationError from '@/components/ui/form-validation-error';
import { Control, useFormContext } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { useTypesQuery } from '@/data/type';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface Props {
  control: Control<any>;
  error: string | undefined;
}

const ProductGroupInput = ({ control, error }: Props) => {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const { setValue, getValues } = useFormContext();
  const { types, loading } = useTypesQuery({
    limit: 200,
    language: locale,
  });

  // Quand les options (types) sont chargées, aligner la valeur du formulaire
  // sur l'option réelle pour que le select l'affiche. Ne pas mettre currentType
  // en dépendance pour éviter une boucle (setValue → re-render → effet → setValue).
  useEffect(() => {
    if (!types?.length || loading) return;
    const currentType = getValues('type');
    const typeId = currentType?.id ?? currentType?.value;
    if (typeId == null || typeId === '') return;
    const typeIdStr = String(typeId);
    const matching = types.find((opt: any) => String(opt?.id) === typeIdStr);
    if (matching) {
      setValue('type', matching, { shouldDirty: false });
    }
  }, [types, loading, setValue, getValues]);

  return (
    <div className="mb-5">
      <Label>{t('form:input-label-group')}*</Label>
      <SelectInput
        name="type"
        control={control}
        getOptionLabel={(option: any) => option?.name}
        getOptionValue={(option: any) => option?.id}
        options={types ?? []}
        isLoading={loading}
      />
      <ValidationError message={t(error!)} />
    </div>
  );
};

export default ProductGroupInput;
