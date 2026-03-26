import Router, { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { productClient } from './client/product';
import {
  ProductQueryOptions,
  GetParams,
  ProductPaginator,
  Product,
} from '@/types';
import { mapPaginatorData } from '@/utils/data-mappers';
import { Routes } from '@/config/routes';
import { Config } from '@/config';

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();
  return useMutation(productClient.create, {
    onSuccess: async () => {
      toast.success(
        t('common:product-created-success', {
          defaultValue: 'Product created successfully',
        })
      );
      const generateRedirectUrl = router.query.shop
        ? `/${router.query.shop}${Routes.product.list}`
        : Routes.product.list;
      await Router.push(generateRedirectUrl, undefined, {
        locale: router.locale ?? Config.defaultLanguage,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const status = error?.response?.status;
      const message = typeof data?.message === 'string' ? data.message : null;
      if (status === 422 && data) {
        const errorMessage: any = Object.values(data).flat();
        const first = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
        toast.error(
          first ??
            t('common:product-created-error', {
              defaultValue: 'Error creating product. Please try again.',
            })
        );
      } else {
        toast.error(
          message ??
            t('common:product-created-error', {
              defaultValue: 'Error creating product. Please try again.',
            })
        );
      }
    },
  });
};

export const useUpdateProductMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation(productClient.update, {
    onSuccess: async (data) => {
      toast.success(
        t('common:product-updated-success', {
          defaultValue: 'Product updated successfully',
        })
      );
      const generateRedirectUrl = router.query.shop
        ? `/${router.query.shop}${Routes.product.list}`
        : Routes.product.list;
      const slug = data?.slug;
      const path = slug ? `${generateRedirectUrl}/${slug}/edit` : generateRedirectUrl;
      await router.push(path, undefined, {
        locale: router.locale ?? Config.defaultLanguage,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const status = error?.response?.status;
      const serverMessage = typeof data?.message === 'string' ? data.message : null;
      const isGenericServerError =
        typeof serverMessage === 'string' &&
        /internal\s*server|server\s*error|^500$/i.test(serverMessage.trim());
      if (process.env.NODE_ENV === 'development') {
        console.error('[Product update error]', { status, data, error: error?.message });
      }
      let messageToShow: string;
      if (status === 422 && data) {
        const errorMessage: any = Object.values(data).flat();
        const first = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
        messageToShow =
          typeof first === 'string'
            ? first
            : t('common:product-updated-error', {
                defaultValue: 'Error updating product. Please try again.',
              });
      } else if (serverMessage && !isGenericServerError) {
        messageToShow = serverMessage;
      } else {
        messageToShow = t('common:product-updated-error', {
          defaultValue: 'Error updating product. Please try again.',
        });
      }
      toast.error(messageToShow);
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation(productClient.delete, {
    onSuccess: () => {
      toast.success(t('common:successfully-deleted'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data.message}`));
    },
  });
};

export const useProductQuery = ({ slug, language }: GetParams) => {
  const { data, error, isLoading } = useQuery<Product, Error>(
    [API_ENDPOINTS.PRODUCTS, { slug, language }],
    () => productClient.get({ slug, language }),
  );

  return {
    product: data,
    error,
    isLoading,
  };
};

export const useProductsQuery = (
  params: Partial<ProductQueryOptions>,
  options: any = {},
) => {
  const { data, error, isLoading } = useQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.PRODUCTS, params],
    ({ queryKey, pageParam }) =>
      productClient.paginated(Object.assign({}, queryKey[1], pageParam)),
    {
      keepPreviousData: true,
      ...options,
    },
  );

  return {
    products: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};

export const useGenerateDescriptionMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation(productClient.generateDescription, {
    onSuccess: () => {
      toast.success(t('Generated...'));
    },
    // Always refetch after error or success:
    onSettled: (data) => {
      queryClient.refetchQueries(API_ENDPOINTS.GENERATE_DESCRIPTION);
      data;
    },
  });
};

export const useInActiveProductsQuery = (
  options: Partial<ProductQueryOptions>,
) => {
  const { data, error, isLoading } = useQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.NEW_OR_INACTIVE_PRODUCTS, options],
    ({ queryKey, pageParam }) =>
      productClient.newOrInActiveProducts(
        Object.assign({}, queryKey[1], pageParam),
      ),
    {
      keepPreviousData: true,
    },
  );

  return {
    products: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};

export const useProductStockQuery = (options: Partial<ProductQueryOptions>) => {
  const { data, error, isLoading } = useQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.LOW_OR_OUT_OF_STOCK_PRODUCTS, options],
    ({ queryKey, pageParam }) =>
      productClient.lowOrOutOfStockProducts(
        Object.assign({}, queryKey[1], pageParam),
      ),
    {
      keepPreviousData: true,
    },
  );

  return {
    products: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};

// Read All products by flash sale

export const useProductsByFlashSaleQuery = (options: any) => {
  const { data, error, isLoading } = useQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.PRODUCTS_BY_FLASH_SALE, options],
    ({ queryKey, pageParam }) =>
      productClient.getProductsByFlashSale(
        Object.assign({}, queryKey[1], pageParam),
      ),
    {
      keepPreviousData: true,
    },
  );

  return {
    products: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};
