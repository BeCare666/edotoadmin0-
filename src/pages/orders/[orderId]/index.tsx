import Card from '@/components/common/card';
import { DownloadIcon } from '@/components/icons/download-icon';
import Layout from '@/components/layouts/admin';
import OrderStatusProgressBox from '@/components/order/order-status-progress-box';
import Button from '@/components/ui/button';
import ErrorMessage from '@/components/ui/error-message';
import ValidationError from '@/components/ui/form-validation-error';
import Loader from '@/components/ui/loader/loader';
import SelectInput from '@/components/ui/select-input';
import { Table } from '@/components/ui/table';
import { clearCheckoutAtom } from '@/contexts/checkout';
import { useCart } from '@/contexts/quick-cart/cart.context';
import {
  useDownloadInvoiceMutation,
  useOrderQuery,
  useUpdateOrderMutation,
} from '@/data/order';
import { NoDataFound } from '@/components/icons/no-data-found';
import { siteSettings } from '@/settings/site.settings';
import { Attachment, OrderStatus, PaymentStatus } from '@/types';
import { formatAddress } from '@/utils/format-address';
import { formatString } from '@/utils/format-string';
import { useIsRTL } from '@/utils/locals';
import { ORDER_STATUS } from '@/utils/order-status';
import usePrice from '@/utils/use-price';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';
import Link from 'next/link';
import OtpReveal, { otpState } from '@/components/order/otp-reveal';
import { fcfa } from '@/components/campaign/campaign-api';
import { adminOnly } from '@/utils/auth-utils';

type FormValues = {
  order_status: any;
};
export default function OrderDetailsPage() {
  const { t } = useTranslation();
  const { query, locale } = useRouter();
  const { alignLeft, alignRight, isRTL } = useIsRTL();
  const { resetCart } = useCart();
  const [, resetCheckout] = useAtom(clearCheckoutAtom);

  useEffect(() => {
    resetCart();
    // @ts-ignore
    resetCheckout();
  }, [resetCart, resetCheckout]);

  const { mutate: updateOrder, isLoading: updating } = useUpdateOrderMutation();
  const {
    order,
    isLoading: loading,
    error,
  } = useOrderQuery({ id: query.orderId as string, language: locale! });
  const { refetch } = useDownloadInvoiceMutation(
    {
      order_id: query.orderId as string,
      isRTL,
      language: locale!,
    },
    { enabled: false }
  );

  const {
    handleSubmit,
    control,

    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { order_status: order?.order_status ?? '' },
  });

  const ChangeStatus = ({ order_status }: FormValues) => {
    updateOrder({
      id: order?.id as string,
      order_status: order_status?.status as string,
    });
  };
  const { price: subtotal } = usePrice(
    order && {
      amount: order?.amount!,
    }
  );

  const { price: total } = usePrice(
    order && {
      amount: order?.paid_total!,
    }
  );
  const { price: discount } = usePrice(
    order && {
      amount: order?.discount! ?? 0,
    }
  );
  const { price: delivery_fee } = usePrice(
    order && {
      amount: order?.delivery_fee!,
    }
  );
  const { price: sales_tax } = usePrice(
    order && {
      amount: order?.sales_tax!,
    }
  );
  const { price: sub_total } = usePrice({ amount: order?.amount! });
  const { price: shipping_charge } = usePrice({
    amount: order?.delivery_fee ?? 0,
  });
  const { price: wallet_total } = usePrice({
    amount: order?.wallet_point?.amount!,
  });

  const amountPayable: number =
    order?.payment_status !== PaymentStatus.SUCCESS
      ? order?.paid_total! - order?.wallet_point?.amount!
      : 0;

  const { price: amountDue } = usePrice({ amount: amountPayable });

  const totalItem = order?.products.reduce(
    // @ts-ignore
    (initial = 0, p) => initial + parseInt(p?.order_quantity!),
    0
  );

  const phoneNumber = useFormatPhoneNumber({
    customer_contact: order?.customer_contact as string,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  async function handleDownloadInvoice() {
    const { data } = await refetch();

    if (data) {
      const a = document.createElement('a');
      a.href = data;
      a.setAttribute('download', 'order-invoice');
      a.click();
    }
  }

  const columns = [
    {
      dataIndex: 'image',
      key: 'image',
      width: 70,
      render: (image: Attachment) => (
        <div className="relative h-[50px] w-[50px]">
          <Image
            src={image?.url ?? siteSettings.product.placeholder}
            alt="alt text"
            fill
            sizes="(max-width: 768px) 100vw"
            className="object-fill"
          />
        </div>
      ),
    },
    {
      title: t('table:table-item-products'),
      dataIndex: 'name',
      key: 'name',
      align: alignLeft,
      render: (name: string, item: any) => (
        <div>
          <span>{name}</span>
          <span className="mx-2">x</span>
          <span className="font-semibold text-heading">
            {item.order_quantity}
          </span>
        </div>
      ),
    },
    {
      title: t('table:table-item-total'),
      dataIndex: 'price',
      key: 'price',
      align: alignRight,
      render: function Render(_: any, item: any) {
        const { price } = usePrice({
          amount: parseFloat(item.subtotal),
        });
        return <span>{price}</span>;
      },
    },
  ];

  const o: any = order;
  const w = o?.delivery_type === 'CUSTOM' ? o?.custom_delivery : null;
  const point = o?.pickup_point;
  const code = otpState(o ?? {});
  const customer = o?.pickupRowsCustomer;
  const cardTitle = 'mb-4 edoto-serif text-lg font-semibold text-heading';

  // Nouveau visuel E·Doto + G2 (point de retrait, code masqué). Logique inchangée :
  // changement de statut, facture, produits et totaux utilisent les mêmes appels qu'avant.
  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-body">{t('form:input-label-order-id')}</p>
          <h1 className="edoto-serif mt-1 text-2xl font-semibold text-heading md:text-3xl">{order?.tracking_number}</h1>
          <p className="mt-1 text-sm text-body">
            {o?.created_at ? new Date(o.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            {' · '}
            {t(o?.payment_status)} · {t(o?.order_status)}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {![OrderStatus.FAILED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(order?.order_status! as OrderStatus) && (
            <form onSubmit={handleSubmit(ChangeStatus)} className="flex items-start gap-3">
              <div className="z-20 w-56">
                <SelectInput
                  name="order_status"
                  control={control}
                  getOptionLabel={(option: any) => t(option.name)}
                  getOptionValue={(option: any) => option.status}
                  options={ORDER_STATUS.slice(0, 6)}
                  placeholder={t(`text-${order?.order_status}`) ?? t('form:input-placeholder-order-status')}
                />
                <ValidationError message={t(errors?.order_status?.message)} />
              </div>
              <Button loading={updating}>{t('form:button-label-change-status')}</Button>
            </form>
          )}
          <Button onClick={handleDownloadInvoice} variant="outline">
            <DownloadIcon className="h-4 w-4 me-2" />
            {t('common:text-download')} {t('common:text-invoice')}
          </Button>
        </div>
      </Card>

      <Card className="flex items-center justify-center">
        <OrderStatusProgressBox orderStatus={order?.order_status as OrderStatus} paymentStatus={order?.payment_status as PaymentStatus} />
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <h2 className={cardTitle}>{t('table:table-item-products')}</h2>
            {order ? (
              <Table
                //@ts-ignore
                columns={columns}
                emptyText={() => (
                  <div className="flex flex-col items-center py-7">
                    <NoDataFound className="w-40" />
                    <div className="mb-1 pt-6 text-base font-semibold text-heading">{t('table:empty-table-data')}</div>
                  </div>
                )}
                data={order?.products!}
                rowKey="id"
                scroll={{ x: 300 }}
              />
            ) : (
              <span>{t('common:no-order-found')}</span>
            )}
            <div className="mt-4 ms-auto flex w-full flex-col space-y-2 border-t border-border-200 pt-4 sm:w-1/2">
              <div className="flex justify-between text-sm text-body"><span>{t('common:order-sub-total')}</span><span>{sub_total}</span></div>
              {!order?.parent_id && (
                <>
                  <div className="flex justify-between text-sm text-body"><span>{t('text-shipping-charge')}</span><span>{shipping_charge}</span></div>
                  <div className="flex justify-between text-sm text-body"><span>{t('text-tax')}</span><span>{sales_tax}</span></div>
                  {order?.discount! > 0 && <div className="flex justify-between text-sm text-body"><span>{t('text-discount')}</span><span>{discount}</span></div>}
                </>
              )}
              <div className="flex justify-between text-base font-semibold text-heading"><span>{t('text-total')}</span><span>{total}</span></div>
              {!order?.parent_id && order?.wallet_point?.amount! ? (
                <>
                  <div className="flex justify-between text-sm text-body"><span>{t('text-paid-from-wallet')}</span><span>{wallet_total}</span></div>
                  <div className="flex justify-between text-base font-semibold text-heading"><span>{t('text-amount-due')}</span><span>{amountDue}</span></div>
                </>
              ) : null}
            </div>
          </Card>

          {order?.note ? (
            <Card>
              <h2 className={cardTitle}>Note</h2>
              <p className="whitespace-pre-line text-sm text-heading">{order?.note}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {/* G2 : retrait (point choisi ou livraison à domicile) et code de retrait */}
          <Card>
            <h2 className={cardTitle}>Retrait</h2>
            {w ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-accent">Livraison à domicile</p>
                <p className="whitespace-pre-line text-heading">{w.description}</p>
                <p className="text-body">Tél. client : {w.phone}</p>
                <p className="text-body">{w.distance_km} km · frais {fcfa(w.fee)}</p>
                <p className="text-body">
                  {w.courier_name ? `Zem : ${w.courier_name} (${w.courier_phone})` : 'Aucun zem désigné'}
                  {' · '}
                  <Link href="/custom-deliveries" className="text-accent hover:underline">Livraisons à domicile</Link>
                </p>
              </div>
            ) : point ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-heading">{point.name}</p>
                <p className="text-body">{point.email}</p>
                {point.pickup_lat != null && point.pickup_lng != null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${point.pickup_lat}&mlon=${point.pickup_lng}#map=18/${point.pickup_lat}/${point.pickup_lng}`}
                    target="_blank" rel="noopener noreferrer" className="text-accent hover:underline"
                  >
                    Voir sur la carte
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-body">Point de retrait non choisi.</p>
            )}

            <div className="mt-5 border-t border-border-200 pt-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-body">Code de retrait</p>
              <OtpReveal code={o?.otp_code} />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${code.className}`}>{code.label}</span>
                {code.key === 'active' && o?.otp_expires_at && <span className="text-body">jusqu&apos;au {new Date(o.otp_expires_at).toLocaleString('fr-FR')}</span>}
                {o?.delivered_at && <span className="text-body">retiré le {new Date(o.delivered_at).toLocaleString('fr-FR')}</span>}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className={cardTitle}>Client</h2>
            <div className="space-y-1 text-sm">
              <p className="text-heading">{customer?.name || order?.customer_name || '—'}</p>
              {customer?.email && <p className="text-body">{customer.email}</p>}
              {order?.customer_contact && <p className="text-body">{phoneNumber}</p>}
              {order?.billing_address && <p className="text-body">{formatAddress(order.billing_address)}</p>}
              {order?.shipping_address && <p className="text-body">{formatAddress(order.shipping_address)}</p>}
            </div>
          </Card>

          <Card>
            <h2 className={cardTitle}>{t('text-order-details')}</h2>
            <div className="space-y-1 text-sm text-body">
              <p>{formatString(order?.products?.length, t('text-item'))}</p>
              {order?.delivery_time && <p>{order?.delivery_time}</p>}
              <p>{`${t('text-payment-method')} : ${order?.payment_gateway}`}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
OrderDetailsPage.authenticate = {
  permissions: adminOnly,
};
OrderDetailsPage.Layout = Layout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'form', 'table'])),
  },
});
