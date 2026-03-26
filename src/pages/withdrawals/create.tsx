import { useState, useEffect } from 'react';
import ShopLayout from '@/components/layouts/shop';
import CreateWithdrawalModal from '@/components/withdrawals/CreateWithdrawalModal';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { getAuthCredentials, hasAccess, adminAndOwnerOnly } from '@/utils/auth-utils';
import { useRouter } from 'next/router';

export default function CreateWithdrawalPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { permissions } = getAuthCredentials();

    useEffect(() => {
        // only super_owner or super_admin
        if (!hasAccess(adminAndOwnerOnly, permissions)) {
            router.replace('/dashboard');
        }
    }, [permissions]);

    // we reuse the modal as a page
    return (
        <div className="p-6 min-h-screen bg-slate-50">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-slate-900">{t('Initier un retrait')}</h1>
                    <p className="text-sm text-slate-500">Remplis le formulaire pour demander un retrait.</p>
                </div>

                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    {/* render modal content inline by reusing the component */}
                    <CreateWithdrawalModal
                        open={true}
                        onClose={() => router.push('/withdrawals')}
                        onCreated={() => router.push('/withdrawals')}
                    />
                </div>
            </div>
        </div>
    );
}

CreateWithdrawalPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
    props: {
        ...(await serverSideTranslations(locale, ['common'])),
    },
});
