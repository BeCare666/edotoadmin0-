import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import ShopLayout from '@/components/layouts/shop';
import Loader from '@/components/ui/loader/loader';
import ErrorMessage from '@/components/ui/error-message';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { getAuthCredentials, hasAccess, adminAndOwnerOnly } from '@/utils/auth-utils';

type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

interface Withdrawal {
    id: number;
    amount: number;
    requested_by: string;
    status: WithdrawalStatus;
    created_at: string;
    method?: string;
    note?: string;
}

interface WithdrawalsResponse {
    data: Withdrawal[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export default function WithdrawalsPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { permissions } = getAuthCredentials();

    // data
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // ui state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // pagination + sizes
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);

    // filters
    const [search, setSearch] = useState<string>('');
    const [statusFilters, setStatusFilters] = useState<WithdrawalStatus[]>(['pending']);
    const [day, setDay] = useState<string>('');
    const [month, setMonth] = useState<string>('');
    const [year, setYear] = useState<string>('');
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [minAmount, setMinAmount] = useState<string>('');
    const [maxAmount, setMaxAmount] = useState<string>('');

    // confirm modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
    const [targetWithdrawal, setTargetWithdrawal] = useState<Withdrawal | null>(null);

    // search debounce
    const searchRef = useRef<number | undefined>();
    useEffect(() => {
        clearTimeout(searchRef.current);
        searchRef.current = window.setTimeout(() => {
            setPage(1); // reset page when changing search
            fetchWithdrawals();
        }, 450);
        return () => clearTimeout(searchRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // refetch when page, limit, filters change
    useEffect(() => {
        if (!hasAccess(adminAndOwnerOnly, permissions)) {
            router.replace('/');
            return;
        }
        fetchWithdrawals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, statusFilters, day, month, year, from, to, minAmount, maxAmount]);

    // helper to toggle status filters
    const toggleStatus = (s: WithdrawalStatus) => {
        setPage(1);
        setStatusFilters((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
        );
    };

    // build query params
    const buildQuery = () => {
        const q = new URLSearchParams();
        q.set('page', String(page));
        q.set('limit', String(limit));

        if (search.trim()) q.set('search', search.trim());

        if (statusFilters.length) q.set('status', statusFilters.join(',')); // backend should accept comma-separated

        if (day && month && year) q.set('day', day);
        if (month && year) q.set('month', month);
        if (year) q.set('year', year);

        if (from) q.set('from', from);
        if (to) q.set('to', to);

        if (minAmount) q.set('min_amount', minAmount);
        if (maxAmount) q.set('max_amount', maxAmount);

        return q.toString();
    };

    // fetch
    const fetchWithdrawals = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                setError('Token missing');
                setLoading(false);
                return;
            }

            const qs = buildQuery();
            const res = await fetch(`${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/withdrawals?${qs}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => null);
                throw new Error(text || 'Failed to fetch withdrawals');
            }

            const data: WithdrawalsResponse = await res.json();

            setWithdrawals(data.data || []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // actions (with modal)
    const openConfirm = (w: Withdrawal, action: 'approve' | 'reject') => {
        setTargetWithdrawal(w);
        setModalAction(action);
        setModalOpen(true);
    };

    const performAction = async () => {
        if (!targetWithdrawal || !modalAction) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return alert('Token missing');

        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/withdrawals/${targetWithdrawal.id}/${modalAction}`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                }
            );
            if (!res.ok) {
                const txt = await res.text().catch(() => null);
                throw new Error(txt || 'Action failed');
            }
            setModalOpen(false);
            setTargetWithdrawal(null);
            fetchWithdrawals();
        } catch (err: any) {
            alert(err.message || 'Failed');
        } finally {
            setLoading(false);
        }
    };

    // computed: pretty totals
    const formattedTotal = useMemo(() => Number(total).toLocaleString(), [total]);

    const StatusTag = ({ status }: { status: WithdrawalStatus }) => {
        const map = {
            pending: {
                label: t("Pending"),
                class: "bg-blue-100 text-blue-700 ring-blue-200",
                dot: "bg-blue-600",
            },
            approved: {
                label: t("Approved"),
                class: "bg-emerald-100 text-emerald-700 ring-emerald-200",
                dot: "bg-emerald-600",
            },
            rejected: {
                label: t("Rejected"),
                class: "bg-red-100 text-red-700 ring-red-200",
                dot: "bg-red-600",
            },
        };

        const s = map[status];

        return (
            <span
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${s.class}`}
            >
                <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
                {s.label}
            </span>
        );
    };


    // small page jump
    const handleJump = (e: React.FormEvent) => {
        e.preventDefault();
        const f = (e.target as any).jump?.value;
        const n = Number(f);
        if (!isNaN(n) && n >= 1 && n <= totalPages) setPage(n);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="w-full max-w-[1920px] mx-auto space-y-8">

                {/* HEADER */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">{t('Withdrawals')}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {t('Total')}:
                            <span className="font-medium text-slate-700 ml-1">{formattedTotal}</span>
                        </p>
                    </div>

                    <select
                        value={limit}
                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </header>

                {/* FILTERS CARD */}
                <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">

                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <input
                            type="text"
                            placeholder={t('Search by user or id')}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="border border-slate-300 rounded-lg px-3 py-2 shadow-sm w-full"
                        />

                        {/* Status */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-600">{t('Status')}</span>
                            <div className="flex items-center gap-3 text-sm">
                                {['pending', 'approved', 'rejected'].map((s) => (
                                    <label key={s} className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={statusFilters.includes(s as WithdrawalStatus)}
                                            onChange={() => toggleStatus(s as WithdrawalStatus)}
                                            className="rounded"
                                        />
                                        <span className="text-slate-600">{t(s.charAt(0).toUpperCase() + s.slice(1))}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Reset */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setDay(''); setMonth(''); setYear('');
                                    setFrom(''); setTo('');
                                    setMinAmount(''); setMaxAmount('');
                                    setStatusFilters(['pending']);
                                    setPage(1);
                                }}
                                className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200"
                            >
                                {t('Reset')}
                            </button>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">

                        {/* Day-Month-Year */}
                        <div className="flex gap-3">
                            {['Day', 'Month', 'Year'].map((label, idx) => (
                                <div key={label} className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-500">{t(label)}</label>
                                    <input
                                        type="number"
                                        placeholder={label === 'Year' ? 'YYYY' : label === 'Day' ? 'DD' : 'MM'}
                                        value={idx === 0 ? day : idx === 1 ? month : year}
                                        onChange={(e) => idx === 0 ? setDay(e.target.value) : idx === 1 ? setMonth(e.target.value) : setYear(e.target.value)}
                                        className="w-20 md:w-24 border rounded-lg px-2 py-1 shadow-sm focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* From-To */}
                        <div className="flex gap-3">
                            {['From', 'To'].map((label, idx) => (
                                <div key={label} className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-500">{t(label)}</label>
                                    <input
                                        type="date"
                                        value={idx === 0 ? from : to}
                                        onChange={(e) => idx === 0 ? setFrom(e.target.value) : setTo(e.target.value)}
                                        className="border rounded-lg px-2 py-1 shadow-sm focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Min/Max Amount */}
                        <div className="flex gap-3">
                            {['Min amount', 'Max amount'].map((label, idx) => (
                                <div key={label} className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-500">{t(label)}</label>
                                    <input
                                        type="number"
                                        value={idx === 0 ? minAmount : maxAmount}
                                        onChange={(e) => idx === 0 ? setMinAmount(e.target.value) : setMaxAmount(e.target.value)}
                                        className="w-32 md:w-36 border rounded-lg px-3 py-1 shadow-sm focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Apply */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => { setPage(1); fetchWithdrawals(); }}
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
                            >
                                {t('Apply')}
                            </button>
                        </div>
                    </div>


                </section>

                {/* TABLE */}
                <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="text-left text-xs uppercase text-slate-500 border-b">
                                    <th className="py-3 px-2">ID</th>
                                    <th className="py-3 px-2">{t('User')}</th>
                                    <th className="py-3 px-2">{t('Amount')}</th>
                                    <th className="py-3 px-2">{t('Method')}</th>
                                    <th className="py-3 px-2">{t('Status')}</th>
                                    <th className="py-3 px-2">{t('Date')}</th>
                                    <th className="py-3 px-2 text-center">{t('Actions')}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {withdrawals.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-6 text-center text-slate-500">
                                            {t('No results')}
                                        </td>
                                    </tr>
                                )}

                                {withdrawals.map((w) => (
                                    <tr key={w.id} className="border-b hover:bg-slate-50/60">
                                        <td className="py-3 px-2 text-sm">{w.id}</td>
                                        <td className="py-3 px-2 text-sm">{w.requested_by}</td>
                                        <td className="py-3 px-2 text-sm font-semibold text-slate-800">{Number(w.amount).toLocaleString()}</td>
                                        <td className="py-3 px-2 text-sm">{w.method ?? '-'}</td>
                                        <td className="py-3 px-2"><StatusTag status={w.status} /></td>
                                        <td className="py-3 px-2 text-sm text-slate-500">{new Date(w.created_at).toLocaleString()}</td>
                                        <td className="py-3 px-2 text-center text-sm">

                                            {w.status === "pending" ? (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => openConfirm(w, 'approve')}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700"
                                                    >
                                                        {t('Approve')}
                                                    </button>

                                                    <button
                                                        onClick={() => openConfirm(w, 'reject')}
                                                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                                                    >
                                                        {t('Reject')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* MODAL */}
                {modalOpen && targetWithdrawal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />

                        <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                            <h3 className="text-lg font-semibold mb-3">
                                {modalAction === 'approve' ? t('Approve Withdrawal') : t('Reject Withdrawal')}
                            </h3>

                            <p className="text-sm text-slate-600 mb-6">
                                {t('Are you sure you want to')} <span className="font-medium">#{targetWithdrawal.id}</span> ?
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-sm"
                                >
                                    {t('Cancel')}
                                </button>

                                <button
                                    onClick={performAction}
                                    className={`px-4 py-2 rounded-lg text-sm text-white ${modalAction === 'approve'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {modalAction === 'approve' ? t('Approve') : t('Reject')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );

}

WithdrawalsPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
    props: {
        ...(await serverSideTranslations(locale, ['common'])),
    },
});
