import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated?: () => void; // callback to refresh list
};

const methods = [
    { value: 'bank', label: 'Bank transfer' },
    // { value: 'mobile_money', label: 'Mobile Money' },
    // { value: 'cash', label: 'Cash' },
];

export default function CreateWithdrawalModal({ open, onClose, onCreated }: Props) {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<string>(methods[0].value);
    const [note, setNote] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);

    // Fetch wallet balance
    useEffect(() => {
        if (!open) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        (async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/wallets/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;

                const data = await res.json();
                setBalance(Number(data.balance ?? data?.data?.balance ?? null));
            } catch {
                // ignore silently
            }
        })();
    }, [open]);

    // Reset form on close
    useEffect(() => {
        if (!open) return;
        setAmount('');
        setMethod(methods[0].value);
        setNote('');
    }, [open]);

    // Validation
    const validate = () => {
        const n = Number(amount);
        if (!amount || isNaN(n) || n <= 0) {
            toast.error('Le montant doit être supérieur à 0');
            return false;
        }
        if (balance !== null && n > balance) {
            toast.error('Solde insuffisant pour ce retrait');
            return false;
        }
        return true;
    };

    // Submit handler
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) throw new Error('Token missing');

            const res = await fetch(`${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/withdrawals`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    method,
                    note: note || null,
                }),
            });

            const text = await res.text().catch(() => null);
            console.log(text);
            if (!res.ok) {
                // Gérer les messages du backend
                if (text?.includes('Vous ne pouvez pas initier un retrait')) {
                    toast.error('Vous ne pouvez pas initier un retrait');
                } else if (text?.includes('Solde insuffisant')) {
                    toast.error('Solde insuffisant pour ce retrait');
                } else if (text?.includes('Wallet introuvable')) {
                    console.log(text)
                    toast.error('Wallet introuvable. Veuillez contacter le support.');
                } else {
                    toast.error('Une erreur est survenue. Veuillez réessayer.');
                }
                return;
            }

            toast.success('Demande créée avec succès');
            if (typeof onCreated === 'function') onCreated();
            setTimeout(onClose, 900);

        } catch (err: any) {
            toast.error('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => onClose()} />
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 z-10">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nouvelle demande de retrait</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Initie une demande — le statut sera <span className="font-medium">pending</span> jusqu'à approbation.
                </p>

                {balance !== null && (
                    <div className="mb-4 text-sm text-slate-700">
                        Solde du wallet: <span className="font-medium">{balance.toLocaleString()}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm text-slate-700 mb-1">Montant</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Ex: 5000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-700 mb-1">Méthode</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            {methods.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-700 mb-1">Note (optionnelle)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-3 py-2 rounded border bg-white text-slate-700 hover:bg-slate-50 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-60 hover:bg-blue-700 transition"
                        >
                            {loading ? 'En cours...' : 'Demander le retrait'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
