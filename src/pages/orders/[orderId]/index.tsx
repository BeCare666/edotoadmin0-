import Card from '@/components/common/card';
import { DownloadIcon } from '@/components/icons/download-icon';
import Layout from '@/components/layouts/admin';
import OrderStatusProgressBox from '@/components/order/order-status-progress-box';
import Button from '@/components/ui/button';
import ErrorMessage from '@/components/ui/error-message';
import ValidationError from '@/components/ui/form-validation-error';
import Loader from '@/components/ui/loader/loader';
import SelectInput from '@/components/ui/select-input';
import { clearCheckoutAtom } from '@/contexts/checkout';
import { useCart } from '@/contexts/quick-cart/cart.context';
import { useOrderQuery, useUpdateOrderMutation } from '@/data/order';
import { siteSettings } from '@/settings/site.settings';
import { OrderStatus, PaymentStatus } from '@/types';
import { formatAddress } from '@/utils/format-address';
import { ORDER_STATUS } from '@/utils/order-status';
import usePrice from '@/utils/use-price';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';
import Link from 'next/link';
import OtpReveal, { otpState } from '@/components/order/otp-reveal';
import { apiCall, fcfa } from '@/components/campaign/campaign-api';
import { ORDER_STAGE_LABELS, ORDER_STAGE_LINKS } from '@/components/order/orders-board';
import { DELIVERY_TYPE_LABEL, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/components/order/order-labels';
import { printPickupLabel } from '@/components/order/print-pickup-label';
import { adminOnly } from '@/utils/auth-utils';

type FormValues = {
  order_status: any;
};

// Dates à l'heure du Bénin
const when = (iso?: string | null, withTime = true) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        timeZone: 'Africa/Porto-Novo',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : '';

const waLink = (phone?: string | null) => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits.startsWith('229') ? digits : `229${digits}`}` : null;
};

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8A837A]">{children}</p>;
}

function Pill({ tone, children }: { tone: 'ok' | 'wait' | 'stop' | 'info' | 'neutral'; children: React.ReactNode }) {
  const tones = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    wait: 'border-amber-200 bg-amber-50 text-amber-900',
    stop: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-[#F3CADB] bg-[#FBEEF3] text-[#A0124A]',
    neutral: 'border-[#E9E5DF] bg-[#F9F8F6] text-[#57524B]',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function CopyButton({ value, label }: { value?: string | null; label: string }) {
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(String(value)).then(() => toast.success(`${label} copié.`))}
      className="rounded-full border border-[#E9E5DF] px-2.5 py-0.5 text-[11px] font-medium text-[#57524B] transition hover:border-[#1A1814] hover:text-[#1A1814]"
    >
      Copier
    </button>
  );
}

export default function OrderDetailsPage() {
  const { t } = useTranslation();
  const { query, locale } = useRouter();
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
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<'process' | 'invoice' | 'print' | null>(null);

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

  const totalItem: number = (order?.products ?? []).reduce(
    // @ts-ignore
    (acc: number, p: any) => acc + (parseInt(p?.order_quantity, 10) || 0),
    0
  );

  const phoneNumber = useFormatPhoneNumber({
    customer_contact: order?.customer_contact as string,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  const o: any = order;
  const w = o?.delivery_type === 'CUSTOM' ? o?.custom_delivery : null;
  const point = o?.pickup_point;
  const code = otpState(o ?? {});
  const customer = o?.pickupRowsCustomer;
  // Étape de suivi (mêmes règles que l'API, orders/order-stage.ts)
  const withdrawnNow = o?.order_status === 'order-completed' || Number(o?.otp_used) === 1;
  const stage: 'to_process' | 'processed' | 'withdrawn' = withdrawnNow ? 'withdrawn' : o?.processed_at ? 'processed' : 'to_process';
  const paid = o?.payment_status === 'payment-success';
  const stopped = ['order-cancelled', 'order-refunded', 'order-failed'].includes(o?.order_status);
  const canProcess = stage === 'to_process' && paid && !stopped;
  const customerName = customer?.name || o?.customer_name || '';

  const labelData = (processedAt?: string | null) => ({
    tracking_number: o?.tracking_number,
    otp_code: o?.otp_code,
    otp_expires_at: o?.otp_expires_at,
    customer_name: customerName,
    customer_contact: o?.customer_contact || w?.phone,
    pickup_point_name: point?.name,
    home_delivery: Boolean(w),
    items_count: totalItem,
    campaign_title: o?.campaign_title,
    processed_at: processedAt ?? o?.processed_at,
  });

  // Facture client générée au paiement (FeexPay) : GET orders/:id/invoice → lien du PDF
  async function handleDownloadInvoice() {
    setBusy('invoice');
    try {
      const { url } = await apiCall(`orders/${query.orderId}/invoice`);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast.info(e.message);
    } finally {
      setBusy(null);
    }
  }

  // Traiter (colis préparé) / annuler le traitement.
  // Traiter imprime aussitôt l'étiquette du colis avec le code de retrait (19/10/2026).
  async function toggleProcessed(processed: boolean) {
    setBusy('process');
    try {
      const res = await apiCall(`orders/${query.orderId}/${processed ? 'process' : 'unprocess'}`, { method: 'PATCH' });
      if (processed) {
        toast.success('Commande traitée : impression de l’étiquette du colis.');
        await printPickupLabel(labelData(res?.processed_at));
      } else {
        toast.success('Traitement annulé : la commande revient « à traiter ».');
      }
      await queryClient.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function reprintLabel() {
    setBusy('print');
    try {
      await printPickupLabel(labelData());
    } finally {
      setBusy(null);
    }
  }

  // Parcours réel de la commande (aucune date inventée : une étape sans date affiche son état)
  const steps = [
    { key: 'created', title: 'Commande passée', done: true, date: o?.created_at, detail: o?.payment_gateway ? `Moyen de paiement : ${o.payment_gateway}` : '' },
    {
      key: 'paid',
      title: paid ? 'Paiement confirmé' : PAYMENT_STATUS_LABEL[o?.payment_status] ?? 'Paiement',
      done: paid,
      date: null,
      detail: paid ? total : 'Une commande se traite une fois payée.',
    },
    {
      key: 'processed',
      title: 'Colis préparé (traitée)',
      done: Boolean(o?.processed_at) || withdrawnNow,
      date: o?.processed_at,
      detail: o?.processed_by_name ? `Par ${o.processed_by_name}` : '',
    },
    {
      key: 'withdrawn',
      title: w ? 'Livrée au client' : 'Retirée au point',
      done: withdrawnNow,
      date: o?.delivered_at,
      detail: withdrawnNow ? 'Commande terminée' : point?.name ? `Au point ${point.name}` : '',
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* En-tête */}
      <Card className="overflow-hidden p-0 md:p-0">
        <div className="flex flex-col gap-6 p-5 md:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Label>{t('form:input-label-order-id')}</Label>
              {o?.campaign_id ? <Pill tone="info">Kit de campagne{o?.campaign_title ? ` · ${o.campaign_title}` : ''}</Pill> : <Pill tone="neutral">Boutique</Pill>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="edoto-serif break-all text-3xl font-semibold text-[#1A1814] md:text-4xl">{order?.tracking_number}</h1>
              <CopyButton value={order?.tracking_number} label="Numéro de commande" />
            </div>
            <p className="mt-2 text-sm text-[#57524B]">Passée le {when(o?.created_at)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone={paid ? 'ok' : stopped ? 'stop' : 'wait'}>{PAYMENT_STATUS_LABEL[o?.payment_status] ?? o?.payment_status}</Pill>
              <Pill tone={stopped ? 'stop' : withdrawnNow ? 'ok' : 'neutral'}>{ORDER_STATUS_LABEL[o?.order_status] ?? o?.order_status}</Pill>
              <Link href={ORDER_STAGE_LINKS[stage]}>
                <Pill tone={stage === 'withdrawn' ? 'ok' : stage === 'processed' ? 'info' : 'wait'}>Suivi : {ORDER_STAGE_LABELS[stage]}</Pill>
              </Link>
            </div>
          </div>
          <div className="shrink-0 text-start lg:text-end">
            <Label>Total payé</Label>
            <p className="edoto-serif mt-1 text-3xl font-semibold text-[#1A1814] md:text-4xl">{total}</p>
            <p className="mt-1 text-sm text-[#57524B]">
              {totalItem} article{totalItem > 1 ? 's' : ''} · {DELIVERY_TYPE_LABEL[o?.delivery_type] ?? 'Mode de retrait non renseigné'}
            </p>
          </div>
        </div>

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 border-t border-[#E9E5DF] md:grid-cols-4">
          {[
            { k: 'Sous-total', v: sub_total },
            { k: w ? 'Livraison' : 'Frais de livraison', v: shipping_charge },
            { k: 'Client', v: customerName || 'Non renseigné' },
            { k: w ? 'Livraison à domicile' : 'Point de retrait', v: w ? `${w.distance_km ?? 0} km` : point?.name || 'Non choisi' },
          ].map((x, i) => (
            <div key={x.k} className={`min-w-0 p-4 md:p-5 ${i % 2 === 1 ? 'border-s border-[#E9E5DF]' : ''} ${i >= 2 ? 'border-t border-[#E9E5DF] md:border-t-0' : ''} ${i === 2 ? 'md:border-s' : ''}`}>
              <Label>{x.k}</Label>
              <p className="mt-1 truncate text-base font-medium text-[#1A1814]">{x.v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Parcours */}
      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="edoto-serif text-xl font-semibold text-[#1A1814]">Parcours de la commande</h2>
          {stopped && <Pill tone="stop">{ORDER_STATUS_LABEL[o?.order_status]}</Pill>}
        </div>
        <ol className="grid gap-4 md:grid-cols-4 md:gap-0">
          {steps.map((s, i) => (
            <li key={s.key} className="relative flex gap-3 md:block md:pe-4">
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute start-[11px] top-7 h-[calc(100%-4px)] w-px md:start-7 md:top-[11px] md:h-px md:w-[calc(100%-28px)] ${steps[i + 1].done ? 'bg-[#1A1814]' : 'bg-[#E9E5DF]'}`}
                />
              )}
              <span
                className={`relative z-[1] grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${
                  s.done ? 'border-[#1A1814] bg-[#1A1814] text-white' : 'border-[#D9D3CA] bg-white text-[#8A837A]'
                }`}
              >
                {s.done ? '✓' : i + 1}
              </span>
              <div className="min-w-0 md:mt-3">
                <p className={`text-sm font-semibold ${s.done ? 'text-[#1A1814]' : 'text-[#8A837A]'}`}>{s.title}</p>
                {s.date && <p className="mt-0.5 text-xs text-[#57524B]">{when(s.date)}</p>}
                {s.detail && <p className="mt-0.5 text-xs text-[#8A837A]">{s.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 border-t border-[#E9E5DF] pt-5">
          <OrderStatusProgressBox orderStatus={order?.order_status as OrderStatus} paymentStatus={order?.payment_status as PaymentStatus} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Articles */}
          <Card>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="edoto-serif text-xl font-semibold text-[#1A1814]">{t('table:table-item-products')}</h2>
              <span className="text-sm text-[#57524B]">{totalItem} article{totalItem > 1 ? 's' : ''}</span>
            </div>
            {order?.products?.length ? (
              <ul className="divide-y divide-[#E9E5DF] border-y border-[#E9E5DF]">
                {(order.products as any[]).map((p) => (
                  <li key={`${p.id}-${p.order_quantity}`} className="flex items-center gap-4 py-4">
                    <img
                      src={p?.image?.thumbnail ?? p?.image?.original ?? p?.image?.url ?? siteSettings.product.placeholder}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl border border-[#E9E5DF] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[#1A1814]">{p.name}</p>
                      <p className="mt-0.5 text-sm text-[#57524B]">
                        {fcfa(Number(p.subtotal) / Math.max(1, Number(p.order_quantity) || 1))} × {p.order_quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-end font-semibold tabular-nums text-[#1A1814]">{fcfa(Number(p.subtotal))}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-[#57524B]">{t('table:empty-table-data')}</p>
            )}
            <dl className="ms-auto mt-5 w-full space-y-2 sm:w-1/2">
              <div className="flex justify-between text-sm text-[#57524B]"><dt>{t('common:order-sub-total')}</dt><dd className="tabular-nums">{sub_total}</dd></div>
              {!order?.parent_id && (
                <>
                  <div className="flex justify-between text-sm text-[#57524B]"><dt>{t('text-shipping-charge')}</dt><dd className="tabular-nums">{shipping_charge}</dd></div>
                  <div className="flex justify-between text-sm text-[#57524B]"><dt>{t('text-tax')}</dt><dd className="tabular-nums">{sales_tax}</dd></div>
                  {order?.discount! > 0 && <div className="flex justify-between text-sm text-[#57524B]"><dt>{t('text-discount')}</dt><dd className="tabular-nums">{discount}</dd></div>}
                </>
              )}
              <div className="flex justify-between border-t border-[#E9E5DF] pt-3 text-base font-semibold text-[#1A1814]"><dt>{t('text-total')}</dt><dd className="tabular-nums">{total}</dd></div>
              {!order?.parent_id && order?.wallet_point?.amount! ? (
                <>
                  <div className="flex justify-between text-sm text-[#57524B]"><dt>{t('text-paid-from-wallet')}</dt><dd>{wallet_total}</dd></div>
                  <div className="flex justify-between text-base font-semibold text-[#1A1814]"><dt>{t('text-amount-due')}</dt><dd>{amountDue}</dd></div>
                </>
              ) : null}
            </dl>
          </Card>

          {order?.note ? (
            <Card>
              <h2 className="edoto-serif mb-3 text-xl font-semibold text-[#1A1814]">Note du client</h2>
              <p className="whitespace-pre-line text-sm text-[#1A1814]">{order?.note}</p>
            </Card>
          ) : null}

          {/* Actions admin : statut et facture (mêmes appels qu'avant) */}
          <Card>
            <h2 className="edoto-serif mb-4 text-xl font-semibold text-[#1A1814]">Actions</h2>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              {![OrderStatus.FAILED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(order?.order_status! as OrderStatus) ? (
                <form onSubmit={handleSubmit(ChangeStatus)} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="z-20 w-full sm:w-64">
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
              ) : (
                <p className="text-sm text-[#57524B]">Commande {ORDER_STATUS_LABEL[o?.order_status]?.toLowerCase()} : statut figé.</p>
              )}
              <div className="flex flex-wrap gap-3">
                {order?.payment_status === PaymentStatus.SUCCESS && (
                  <Button onClick={handleDownloadInvoice} variant="outline" loading={busy === 'invoice'} disabled={busy === 'invoice'}>
                    <DownloadIcon className="h-4 w-4 me-2" />
                    {t('common:text-download')} {t('common:text-invoice')}
                  </Button>
                )}
                {stage === 'processed' && (
                  <Button onClick={() => toggleProcessed(false)} variant="outline" loading={busy === 'process'} disabled={busy === 'process'}>Annuler le traitement</Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Code de retrait */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="edoto-serif text-xl font-semibold text-[#1A1814]">Code de retrait</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${code.className}`}>{code.label}</span>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-[#D9D3CA] bg-[#F9F8F6] p-4 text-center">
              <OtpReveal code={o?.otp_code} />
            </div>
            <div className="mt-3 space-y-1 text-xs text-[#57524B]">
              {code.key === 'active' && o?.otp_expires_at && <p>Valable jusqu&apos;au {when(o.otp_expires_at)}</p>}
              {o?.delivered_at && <p>Retiré le {when(o.delivered_at)}</p>}
              {o?.otp_attempts ? <p>{o.otp_attempts} saisie{Number(o.otp_attempts) > 1 ? 's' : ''} au point</p> : null}
            </div>
            {(stage === 'processed' || stage === 'withdrawn') && o?.otp_code && (
              <button
                type="button"
                onClick={reprintLabel}
                disabled={busy === 'print'}
                className="mt-4 w-full rounded-xl border border-[#1A1814] px-4 py-2.5 text-sm font-medium text-[#1A1814] transition hover:bg-[#1A1814] hover:text-white disabled:opacity-50"
              >
                Réimprimer l&apos;étiquette du colis
              </button>
            )}
          </Card>

          {/* Retrait */}
          <Card>
            <h2 className="edoto-serif mb-4 text-xl font-semibold text-[#1A1814]">{w ? 'Livraison à domicile' : 'Point de retrait'}</h2>
            {w ? (
              <div className="space-y-3 text-sm">
                <p className="whitespace-pre-line text-[#1A1814]">{w.description}</p>
                <dl className="grid grid-cols-2 gap-3">
                  <div><Label>Distance</Label><p className="mt-0.5 text-[#1A1814]">{w.distance_km} km</p></div>
                  <div><Label>Frais</Label><p className="mt-0.5 text-[#1A1814]">{fcfa(w.fee)}</p></div>
                  <div className="col-span-2"><Label>Zem</Label><p className="mt-0.5 text-[#1A1814]">{w.courier_name ? `${w.courier_name} (${w.courier_phone})` : 'Aucun zem désigné'}</p></div>
                </dl>
                <Link href="/custom-deliveries" className="inline-block text-[#C2185B] hover:underline">Gérer les livraisons à domicile</Link>
              </div>
            ) : point ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-[#1A1814]">{point.name}</p>
                {point.pickup_address && <p className="text-[#57524B]">{point.pickup_address}</p>}
                {point.email && <a href={`mailto:${point.email}`} className="block text-[#57524B] hover:text-[#1A1814]">{point.email}</a>}
                {point.pickup_lat != null && point.pickup_lng != null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${point.pickup_lat}&mlon=${point.pickup_lng}#map=18/${point.pickup_lat}/${point.pickup_lng}`}
                    target="_blank" rel="noopener noreferrer" className="inline-block text-[#C2185B] hover:underline"
                  >
                    Voir sur la carte
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#57524B]">Point de retrait non choisi.</p>
            )}
          </Card>

          {/* Client */}
          <Card>
            <h2 className="edoto-serif mb-4 text-xl font-semibold text-[#1A1814]">Client</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-[#1A1814]">{customerName || 'Client non renseigné'}</p>
              {customer?.email && <a href={`mailto:${customer.email}`} className="block text-[#57524B] hover:text-[#1A1814]">{customer.email}</a>}
              {order?.customer_contact && (
                <div className="flex flex-wrap items-center gap-3">
                  <a href={`tel:${order.customer_contact}`} className="text-[#57524B] hover:text-[#1A1814]">{phoneNumber}</a>
                  {waLink(order.customer_contact) && (
                    <a href={waLink(order.customer_contact)!} target="_blank" rel="noopener noreferrer" className="text-[#C2185B] hover:underline">WhatsApp</a>
                  )}
                </div>
              )}
              {order?.billing_address && <p className="text-[#57524B]">{formatAddress(order.billing_address)}</p>}
              {order?.shipping_address && <p className="text-[#57524B]">{formatAddress(order.shipping_address)}</p>}
              {customer?.id && (
                <Link href={`/users/customer?search=${encodeURIComponent(customer.email ?? '')}`} className="inline-block text-[#C2185B] hover:underline">Voir le compte</Link>
              )}
            </div>
          </Card>

          {/* Paiement */}
          <Card>
            <h2 className="edoto-serif mb-4 text-xl font-semibold text-[#1A1814]">{t('text-order-details')}</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><Label>Paiement</Label><p className="mt-0.5 text-[#1A1814]">{PAYMENT_STATUS_LABEL[o?.payment_status] ?? o?.payment_status}</p></div>
              <div><Label>Moyen</Label><p className="mt-0.5 text-[#1A1814]">{o?.payment_gateway || 'Non renseigné'}</p></div>
              <div><Label>Mise à jour</Label><p className="mt-0.5 text-[#1A1814]">{when(o?.updated_at) || 'Non renseignée'}</p></div>
              <div><Label>Articles</Label><p className="mt-0.5 text-[#1A1814]">{order?.products?.length ?? 0} produit{(order?.products?.length ?? 0) > 1 ? 's' : ''}</p></div>
              {order?.delivery_time && <div className="col-span-2"><Label>Créneau</Label><p className="mt-0.5 text-[#1A1814]">{order.delivery_time}</p></div>}
            </dl>
          </Card>
        </div>
      </div>

      {/* Bouton flottant à droite, à 5 px du bas : traite la commande et imprime l'étiquette du code de retrait */}
      {canProcess && (
        <button
          type="button"
          onClick={() => toggleProcessed(true)}
          disabled={busy === 'process'}
          style={{ bottom: 5 }}
          className="fixed end-5 z-50 inline-flex items-center gap-3 rounded-full bg-[#1A1814] py-3.5 pe-6 ps-5 text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgba(26,24,20,0.55)] transition hover:bg-[#C2185B] disabled:cursor-wait disabled:opacity-70"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 14h12v7H6z" strokeLinejoin="round" />
          </svg>
          {busy === 'process' ? 'Traitement…' : 'Traiter et imprimer le code'}
        </button>
      )}
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
