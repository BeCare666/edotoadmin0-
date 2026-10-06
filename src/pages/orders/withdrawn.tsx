import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import { adminOnly } from '@/utils/auth-utils';
import OrdersBoard from '@/components/order/orders-board';

// Commandes : étape « withdrawn » (voir components/order/orders-board.tsx)
export default function OrdersWithdrawn() {
  return <OrdersBoard stage="withdrawn" />;
}

OrdersWithdrawn.authenticate = {
  permissions: adminOnly,
};
OrdersWithdrawn.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
