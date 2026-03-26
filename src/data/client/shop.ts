import {
  QueryOptions,
  Shop,
  ShopInput,
  ShopPaginator,
  ShopQueryOptions,
  TransferShopOwnershipInput,
} from '@/types';
import { ApproveShopInput } from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { HttpClient } from './http-client';
import { crudFactory } from './curd-factory';

export const shopClient = {
  ...crudFactory<Shop, QueryOptions, ShopInput>(API_ENDPOINTS.SHOPS),
  get({ slug, with: withParam }: { slug: String; with?: string }) {
    return HttpClient.get<Shop>(`${API_ENDPOINTS.SHOPS}/${slug}`, {
      ...(withParam ? { with: withParam } : {}),
    });
  },
  paginated: ({
    name,
    is_active,
    limit,
    page,
    orderBy,
    sortedBy,
    ...rest
  }: Partial<ShopQueryOptions>) => {
    const order = orderBy ?? 'created_at';
    const sort = sortedBy ?? 'desc';
    const params: Record<string, unknown> = {
      searchJoin: 'and',
      with: 'logo;cover_image',
      ...rest,
      limit: limit ?? 15,
      page: page ?? 1,
      orderBy: order,
      sortedBy: sort,
      order_by: order,
      sort,
    };
    if (is_active !== undefined && is_active !== null) {
      params.is_active = is_active;
    }
    if (name != null && String(name).trim() !== '') {
      params.search = HttpClient.formatSearchParams({ name });
    }
    return HttpClient.get<ShopPaginator>(API_ENDPOINTS.SHOPS, params);
  },
  newOrInActiveShops: ({
    is_active,
    name,
    ...params
  }: Partial<ShopQueryOptions>) => {
    return HttpClient.get<ShopPaginator>(API_ENDPOINTS.NEW_OR_INACTIVE_SHOPS, {
      searchJoin: 'and',
      is_active,
      name,
      ...params,
      search: HttpClient.formatSearchParams({ is_active, name }),
    });
  },
  approve: (variables: ApproveShopInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.APPROVE_SHOP, variables);
  },
  disapprove: (variables: { id: string }) => {
    return HttpClient.post<{ id: string }>(
      API_ENDPOINTS.DISAPPROVE_SHOP,
      variables
    );
  },
  transferShopOwnership: (variables: TransferShopOwnershipInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.TRANSFER_SHOP_OWNERSHIP, variables);
  },
};
