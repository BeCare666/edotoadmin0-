import {
  ProductType,
  Product,
  CreateProduct,
  Type,
  Category,
  Tag,
  AttachmentInput,
  VariationOption,
  Variation,
  AttributeValue,
} from '@/types';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import sum from 'lodash/sum';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { omitTypename } from '@/utils/omit-typename';
import { cartesian } from '@/utils/cartesian';

/** L'API peut renvoyer variation_options en tableau ou dans { data: [...] } */
function ensureVariationOptionsArray(val: unknown): Variation[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && 'data' in val && Array.isArray((val as { data: unknown }).data)) {
    return (val as { data: Variation[] }).data;
  }
  return [];
}

export type ProductFormValues = Omit<
  CreateProduct,
  | 'author_id'
  | 'type_id'
  | 'manufacturer_id'
  | 'shop_id'
  | 'categories'
  | 'tags'
  | 'digital_file'
> & {
  type: Pick<Type, 'id' | 'name'>;
  product_type: ProductTypeOption;
  categories: Pick<Category, 'id' | 'name'>[];
  tags: Pick<Tag, 'id' | 'name'>[];
  digital_file_input: AttachmentInput;
  is_digital: boolean;
  slug: string;
  in_flash_sale: boolean;
  variations?: AttributeValue[];
  variation_options?: Variation[];
  // image: AttachmentInput;
};

export type ProductTypeOption = {
  value: ProductType;
  name: string;
};

export const productTypeOptions: ProductTypeOption[] = Object.entries(
  ProductType,
).map(([key, value]) => ({
  name: key,
  value,
}));

export function getFormattedVariations(variations: any) {
  const variationGroup = groupBy(variations, 'attribute.slug');
  return Object.values(variationGroup)?.map((vg) => {
    return {
      attribute: vg?.[0]?.attribute,
      value: vg?.map((v) => ({ id: v.id, value: v.value })),
    };
  });
}

export function processOptions(options: any) {
  try {
    return JSON.parse(options);
  } catch (error) {
    return options;
  }
}

export function calculateMinMaxPrice(variationOptions: any) {
  if (!variationOptions || !variationOptions.length) {
    return {
      min_price: null,
      max_price: null,
    };
  }
  const sortedVariationsByPrice = orderBy(variationOptions, ['price']);
  const sortedVariationsBySalePrice = orderBy(variationOptions, ['sale_price']);
  return {
    min_price:
      sortedVariationsBySalePrice?.[0].sale_price <
        sortedVariationsByPrice?.[0]?.price
        ? sortedVariationsBySalePrice?.[0].sale_price
        : sortedVariationsByPrice?.[0]?.price,
    max_price:
      sortedVariationsByPrice?.[sortedVariationsByPrice?.length - 1]?.price,
  };
}

export function calculateQuantity(variationOptions: any) {
  return sum(
    variationOptions?.map(({ quantity }: { quantity: number }) => quantity),
  );
}

/** Format attendu par le formulaire : [{ categories_id, sous_categories_id: number[], sub_categories_id: number[] }] */
type CategoryFormRow = {
  categories_id: number;
  sous_categories_id: number[];
  sub_categories_id: number[];
};

/**
 * Normalise les catégories produit (toutes formes possibles de l'API) vers le format formulaire.
 * Règles recommandées pour l'édition : on préserve ce que le backend envoie (ids, sous, sous-sous).
 */
export function normalizeProductCategoriesForForm(product: Product | null | undefined): CategoryFormRow[] {
  if (!product) return [];
  const p = product as any;
  let raw = p.categories ?? p.product_categories ?? p.categories_list;
  // API peut renvoyer { data: [...] }
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.data)) raw = raw.data;
  if (raw != null && !Array.isArray(raw)) raw = [raw];
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) {
    const single = p.category ?? p.product_category;
    if (single != null) raw = Array.isArray(single) ? single : [single];
  }
  if (!Array.isArray(raw) || raw.length === 0) return [];
  // Tableau d'objets { categories_id ou id, pivot?, sous_categories_id?, sous_categories?, sub_categories_id?, sub_categories? }
  if (Array.isArray(raw)) {
    const parseIds = (v: any): number[] => {
      if (Array.isArray(v)) {
        return v
          .map((x: any) => (typeof x === 'object' && x != null && (x.id != null || x.sous_category_id != null)) ? Number(x.id ?? x.sous_category_id) : Number(x))
          .filter((n) => !Number.isNaN(n));
      }
      if (v == null || v === '') return [];
      if (typeof v === 'string') return v.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
      return [Number(v)];
    };
    const extractIdsFromObjects = (arr: any[], idKey = 'id', altKey = '') =>
      Array.isArray(arr)
        ? arr.map((x: any) => Number(x?.[idKey] ?? x?.[altKey] ?? x?.sous_category_id ?? x?.sub_category_id ?? 0)).filter((n) => n > 0)
        : [];
    const rows = raw.map((c: any) => {
      const pivot = c.pivot ?? c;
      const catId = Number(pivot.categories_id ?? c.categories_id ?? c.id ?? 0);
      const sousFromRelation = extractIdsFromObjects(c.sous_categories ?? [], 'id', 'sous_category_id');
      const subFromRelation = extractIdsFromObjects(c.sub_categories ?? [], 'id', 'sub_category_id');
      const sousFromPivot = extractIdsFromObjects(pivot.sous_categories ?? [], 'id', 'sous_category_id');
      const subFromPivot = extractIdsFromObjects(pivot.sub_categories ?? [], 'id', 'sub_category_id');
      const sousIds = parseIds(
        pivot.sous_categories_id ?? pivot.sous_category_ids ?? pivot.sous_category_id ?? c.sous_categories_id ?? c.sous_category_ids ?? c.sous_category_id
      ) as number[];
      const subIds = parseIds(
        pivot.sub_categories_id ?? pivot.sub_category_ids ?? pivot.sub_category_id ?? c.sub_categories_id ?? c.sub_category_ids ?? c.sub_category_id
      ) as number[];
      return {
        categories_id: catId,
        sous_categories_id: sousIds.length ? sousIds : sousFromRelation.length ? sousFromRelation : sousFromPivot,
        sub_categories_id: subIds.length ? subIds : subFromRelation.length ? subFromRelation : subFromPivot,
      };
    }).filter((row: CategoryFormRow) => row.categories_id > 0);
    const parseIdsProduct = (v: any): number[] => {
      if (v == null || v === '') return [];
      if (Array.isArray(v)) return v.map((x: any) => Number(x)).filter((n) => !Number.isNaN(n));
      if (typeof v === 'string') return v.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
      return [Number(v)].filter((n) => !Number.isNaN(n));
    };
    const productSous = parseIdsProduct(p.sous_categories_id ?? p.sous_category_ids ?? p.sous_category_id);
    const productSub = parseIdsProduct(p.sub_categories_id ?? p.sub_category_ids ?? p.sub_category_id);
    if (rows.length > 0 && (productSous.length > 0 || productSub.length > 0)) {
      const first = rows[0];
      if ((!first.sous_categories_id || first.sous_categories_id.length === 0) && productSous.length > 0)
        first.sous_categories_id = productSous;
      if ((!first.sub_categories_id || first.sub_categories_id.length === 0) && productSub.length > 0)
        first.sub_categories_id = productSub;
    }
    return rows;
  }
  // Backend renvoie category_ids (liste d'ids) ou categories_id (un seul id)
  const ids = p.category_ids ?? p.category_ids_list;
  if (Array.isArray(ids) && ids.length > 0) {
    return ids.map((id: number | string) => ({
      categories_id: Number(id),
      sous_categories_id: [],
      sub_categories_id: [],
    }));
  }
  const singleId = p.categories_id ?? p.category_id;
  if (singleId != null && singleId !== '') {
    return [{ categories_id: Number(singleId), sous_categories_id: [], sub_categories_id: [] }];
  }
  return [];
}

export function getProductDefaultValues(
  product: Product,
  isNewTranslation: boolean = false,
) {
  if (!product) {
    return {
      product_type: productTypeOptions[0],
      min_price: 0.0,
      max_price: 0.0,
      categories: [],
      tags: [],
      type: null,
      in_stock: true,
      is_taxable: false,
      image: [],
      gallery: [],
      video: [],
      variations: [],
      variation_options: [],
    };
  }

  const {
    variations,
    variation_options,
    product_type,
    is_digital,
    digital_file,
    categories,
    tags,
    type: productType,
  } = product;

  return cloneDeep({
    ...product,

    // ---- Type de mise en page (select) ----
    type: productType
      ? {
          id: String((productType as any)?.id ?? (product as any)?.type_id),
          name: (productType as any)?.name ?? '',
        }
      : (product as any)?.type_id
        ? { id: String((product as any).type_id), name: '' }
        : null,

    // ---- Product type ----
    product_type: productTypeOptions.find(
      (option) => product_type === option.value,
    ),

    // ---- Digital file (simple product) ----
    ...(product_type === ProductType.Simple && {
      ...(is_digital && {
        digital_file_input: {
          id: digital_file?.attachment_id,
          thumbnail: digital_file?.url,
          original: digital_file?.url,
        },
      }),
    }),

    // ---- Variable product ----
    ...(product_type === ProductType.Variable && {
      variations: getFormattedVariations(variations),
      variation_options: variation_options?.map(({ image, ...option }: any) => {
        return {
          ...option,
          ...(!isEmpty(image) && { image: omitTypename(image) }),
          ...(option?.digital_file && {
            digital_file_input: {
              id: option.digital_file.attachment_id,
              file_name: option.digital_file.file_name,
            },
          }),
        };
      }),
    }),

    // ----------------------------------------------------
    // 🆕  CATEGORIES (toutes formes API → format ProductCategoryInput + backend)
    // ----------------------------------------------------
    categories: normalizeProductCategoriesForForm(product),

    // ----------------------------------------------------
    // 🆕  TAGS (ajout)
    // ----------------------------------------------------
    tags:
      tags?.map((t: any) => ({
        id: t.id,
        name: t.name,
      })) ?? [],

    // ---- New Translation (reset) ----
    ...(isNewTranslation && {
      type: null,
      categories: [],
      author_id: null,
      manufacturer_id: null,
      tags: [],
      author: [],
      manufacturer: [],
      variations: [],
      variation_options: [],
      digital_file: '',
      digital_file_input: {},
      ...(product_type === ProductType.Variable && {
        quantity: null,
      }),
    }),
  });
}


export function filterAttributes(attributes: any, variations: any) {
  let res = [];
  res = attributes?.filter((el: any) => {
    return !variations?.find((element: any) => {
      return element?.attribute?.slug === el?.slug;
    });
  });
  return res;
}

export function getCartesianProduct(values: any) {
  const formattedValues = values
    ?.map(
      (v: any) =>
        v?.value?.map((a: any) => ({
          name: v?.attribute?.name,
          value: a?.value,
          id: a?.id,
        })),
    )
    .filter((i: any) => i !== undefined);
  if (isEmpty(formattedValues)) return [];
  return cartesian(...formattedValues);
}

export function getProductInputValues(
  values: ProductFormValues,
  initialValues: any,
  isNewTranslation: boolean = false,
) {
  const {
    product_type,
    type,
    quantity,
    image,
    is_digital,
    categories,
    tags,
    digital_file_input,
    variation_options,
    variations,
    in_flash_sale,
    ...simpleValues
  } = values;
  // const { locale } = useRouter();
  // const router = useRouter();

  return {
    ...simpleValues,
    is_digital: true,
    in_flash_sale,

    type_id: type?.id,
    product_type: 'simple',

    // Formulaire : [{ categories_id, sous_categories_id, sub_categories_id }] → API : ids de catégories (string[]).
    categories: (categories ?? []).map((row: any) => String(row?.categories_id ?? row?.id ?? '')).filter(Boolean),
    tags: (tags ?? []).map((tag) => tag?.id),

    image: omitTypename<any>(image),
    gallery: (values.gallery ?? []).map((gi: any) => omitTypename(gi)),
    quantity,

    digital_file: {
      id: initialValues?.digital_file?.id,
      attachment_id: digital_file_input?.id,
      url: digital_file_input?.original,
      file_name: digital_file_input?.file_name,
      ...(!isNewTranslation && { id: initialValues?.digital_file?.id }),
    },

    variations: [],
    variation_options: {
      upsert: [],
      delete: ensureVariationOptionsArray(initialValues?.variation_options).map(
        (variation: Variation) => variation?.id,
      ),
    },

    ...(product_type?.value === ProductType?.Variable && {
      quantity: calculateQuantity(variation_options ?? []),
      variations: (variations ?? []).flatMap(
        ({ value }: any) =>
          (value ?? []).map(({ id }: any) => ({ attribute_value_id: id })),
      ),
      variation_options: {
        upsert: (variation_options ?? []).map(
          ({
            options,
            id,
            digital_files,
            image: variationImage,
            digital_file_input: digital_file_input_,
            ...rest
          }: any) => ({
            ...(id !== '' ? { id } : {}),
            ...omit(rest, '__typename'),
            ...(!isEmpty(variationImage) && {
              image: omitTypename(variationImage),
            }),
            ...(rest?.is_digital && {
              digital_file: {
                id: digital_files?.id,
                attachment_id: digital_file_input_?.id,
                url: digital_file_input_?.original,
                file_name: digital_file_input_?.file_name,
              },
            }),
            options: processOptions(options ?? []).map(
              ({ name, value }: VariationOption) => ({
                name,
                value,
              }),
            ),
          }),
        ),
        delete: ensureVariationOptionsArray(initialValues?.variation_options)
          .map((initialVariationOption: Variation) => {
            const find = (variation_options ?? []).find(
              (variationOption: Variation) =>
                variationOption?.id === initialVariationOption?.id,
            );
            if (!find) {
              return initialVariationOption?.id;
            }
          })
          .filter((item?: number) => item !== undefined),
      },
    }),

    ...calculateMinMaxPrice(variation_options ?? []),
  };

}
