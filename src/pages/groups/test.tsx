"use client";

import { useEffect, useState } from "react";
import { HttpClient, getFormErrors } from '@/data/client/http-client';

interface TypeItem {
    id: number;
    name: string;
    slug?: string;
    icon?: string;
    language: string;
}

export default function TypesPage() {
    const [types, setTypes] = useState<TypeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "", slug: "", icon: "", language: "fr" });

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const data = await HttpClient.get<TypeItem[]>("/types");
            setTypes(data);
        } catch (error) {
            alert(getFormErrors(error) ?? "Erreur lors du chargement");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await HttpClient.post("/types", form);
            setForm({ name: "", slug: "", icon: "", language: "fr" });
            fetchTypes();
        } catch (error) {
            alert(getFormErrors(error) ?? "Erreur lors de la création");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Voulez-vous vraiment supprimer ce type ?")) return;
        try {
            await HttpClient.delete(`/types/${id}`);
            fetchTypes();
        } catch (error) {
            alert(getFormErrors(error) ?? "Erreur lors de la suppression");
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">⚙️ Gestion des Types</h1>

            {/* Formulaire création */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-10">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Créer un nouveau Type</h2>
                <form onSubmit={handleCreate} className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Nom *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600">Slug</label>
                        <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600">Icône (URL)</label>
                        <input
                            type="text"
                            value={form.icon}
                            onChange={(e) => setForm({ ...form, icon: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600">Langue *</label>
                        <select
                            value={form.language}
                            onChange={(e) => setForm({ ...form, language: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="fr">Français</option>
                            <option value="en">Anglais</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                        ➕ Créer
                    </button>
                </form>
            </div>

            {/* Liste */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">📋 Liste des Types</h2>
            {loading ? (
                <p className="text-gray-500">Chargement...</p>
            ) : types.length === 0 ? (
                <p className="text-gray-500">Aucun type trouvé.</p>
            ) : (
                <div className="space-y-4">
                    {types.map((t) => (
                        <div
                            key={t.id}
                            className="flex items-center justify-between bg-white rounded-xl shadow p-4 hover:shadow-lg transition"
                        >
                            <div className="flex items-center gap-3">
                                {t.icon && (
                                    <img
                                        src={t.icon}
                                        alt="Icône"
                                        className="w-8 h-8 rounded"
                                        onError={(e) =>
                                            ((e.target as HTMLImageElement).style.display = "none")
                                        }
                                    />
                                )}
                                <div>
                                    <p className="font-semibold text-gray-800">{t.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {t.slug || "—"} • {t.language.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {/* Modifier */}
                                <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                    ✏️ <span className="hidden sm:inline">Modifier</span>
                                </button>
                                {/* Supprimer */}
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                    🗑️ <span className="hidden sm:inline">Supprimer</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
