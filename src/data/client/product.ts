import {
  Product,
  CreateProduct,
  ProductPaginator,
  QueryOptions,
  GetParams,
  ProductQueryOptions,
  GenerateDescriptionInput,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { crudFactory } from './curd-factory';
import { HttpClient } from './http-client';

/** Keys sent only for relations; backend may not have these columns on products table */
const UPDATE_OMIT_KEYS = ['variations'] as const;

/** Backend peut renvoyer { data: product } (Laravel) ou le produit directement */
function normalizeProductResponse(
  response: unknown,
  fallback: Partial<Product>
): Product & { slug?: string } {
  if (response != null && typeof response === 'object' && 'data' in response) {
    const inner = (response as { data?: unknown }).data;
    if (inner != null && typeof inner === 'object') {
      return { ...fallback, ...inner } as Product & { slug?: string };
    }
  }
  if (response != null && typeof response === 'object') {
    return { ...fallback, ...response } as Product & { slug?: string };
  }
  return { ...fallback } as Product & { slug?: string };
}

export const productClient = {
  ...crudFactory<Product, QueryOptions, CreateProduct>(API_ENDPOINTS.PRODUCTS),
  async update(payload: Partial<CreateProduct> & { id: string }) {
    const { id, ...rest } = payload;
    const safePayload = { ...rest };
    UPDATE_OMIT_KEYS.forEach((key) => delete (safePayload as Record<string, unknown>)[key]);
    const response = await HttpClient.put<Product | { data?: Product }>(
      `${API_ENDPOINTS.PRODUCTS}/${id}`,
      safePayload
    );
    return normalizeProductResponse(response, { id, slug: (payload as any).slug });
  },
  get({ slug, language }: GetParams) {
    return HttpClient.get<Product>(`${API_ENDPOINTS.PRODUCTS}/${slug}`, {
      language,
      with: 'type;shop;categories;tags;variations.attribute.values;variation_options;variation_options.digital_file;author;manufacturer;digital_file',
    });
  },
  paginated: ({
    type,
    name,
    categories,
    shop_id,
    product_type,
    status,
    ...params
  }: Partial<ProductQueryOptions>) => {
    return HttpClient.get<ProductPaginator>(API_ENDPOINTS.PRODUCTS, {
      searchJoin: 'and',
      with: 'shop;type;categories',
      shop_id,
      ...params,
      search: HttpClient.formatSearchParams({
        type,
        name,
        categories,
        shop_id,
        product_type,
        status,
      }),
    });
  },
  popular({ shop_id, ...params }: Partial<ProductQueryOptions>) {
    return HttpClient.get<Product[]>(API_ENDPOINTS.POPULAR_PRODUCTS, {
      searchJoin: 'and',
      with: 'type;shop',
      ...params,
      search: HttpClient.formatSearchParams({ shop_id }),
    });
  },
  lowStock({ shop_id, ...params }: Partial<ProductQueryOptions>) {
    return HttpClient.get<Product[]>(
      API_ENDPOINTS.LOW_STOCK_PRODUCTS_ANALYTICS,
      {
        searchJoin: 'and',
        with: 'type;shop',
        ...params,
        search: HttpClient.formatSearchParams({ shop_id }),
      },
    );
  },
  generateDescription: (data: GenerateDescriptionInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.GENERATE_DESCRIPTION, data);
  },
  newOrInActiveProducts: ({
    user_id,
    shop_id,
    status,
    name,
    ...params
  }: Partial<ProductQueryOptions>) => {
    return HttpClient.get<ProductPaginator>(
      API_ENDPOINTS.NEW_OR_INACTIVE_PRODUCTS,
      {
        searchJoin: 'and',
        user_id,
        shop_id,
        status,
        name,
        ...params,
        search: HttpClient.formatSearchParams({
          status,
          name,
        }),
      },
    );
  },
  lowOrOutOfStockProducts: ({
    user_id,
    shop_id,
    status,
    categories,
    name,
    type,
    ...params
  }: Partial<ProductQueryOptions>) => {
    return HttpClient.get<ProductPaginator>(
      API_ENDPOINTS.LOW_OR_OUT_OF_STOCK_PRODUCTS,
      {
        searchJoin: 'and',
        user_id,
        shop_id,
        status,
        name,
        ...params,
        search: HttpClient.formatSearchParams({
          status,
          name,
          categories,
          type,
        }),
      },
    );
  },
  productByCategory({
    limit,
    language,
  }: {
    limit?: number;
    language?: string;
  }) {
    return HttpClient.get<any>(API_ENDPOINTS.CATEGORY_WISE_PRODUCTS, {
      limit,
      language,
    });
  },
  // productByCategory({ shop_id, ...params }: Partial<ProductQueryOptions>) {
  //   return HttpClient.get<Product[]>(API_ENDPOINTS.CATEGORY_WISE_PRODUCTS, {
  //     searchJoin: 'and',
  //     ...params,
  //     search: HttpClient.formatSearchParams({ shop_id }),
  //   });
  // },
  mostSoldProductByCategory({
    shop_id,
    ...params
  }: Partial<ProductQueryOptions>) {
    return HttpClient.get<Product[]>(
      API_ENDPOINTS.CATEGORY_WISE_PRODUCTS_SALE,
      {
        searchJoin: 'and',
        ...params,
        search: HttpClient.formatSearchParams({ shop_id }),
      },
    );
  },
  getProductsByFlashSale: ({
    user_id,
    shop_id,
    slug,
    name,
    ...params
  }: any) => {
    return HttpClient.get<ProductPaginator>(
      API_ENDPOINTS.PRODUCTS_BY_FLASH_SALE,
      {
        searchJoin: 'and',
        user_id,
        shop_id,
        slug,
        name,
        ...params,
        search: HttpClient.formatSearchParams({
          name,
        }),
      },
    );
  },
  topRated({ shop_id, ...params }: Partial<ProductQueryOptions>) {
    return HttpClient.get<Product[]>(API_ENDPOINTS.TOP_RATED_PRODUCTS, {
      searchJoin: 'and',
      ...params,
      search: HttpClient.formatSearchParams({ shop_id }),
    });
  },
};
