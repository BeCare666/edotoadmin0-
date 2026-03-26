import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
type Country = {
    id: number;
    name: string;
    code: string; // code ISO2, ex: "BJ"
};

interface CountrySelectProps {
    value?: number;
    onChange?: (value: number) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange }) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
const { t } = useTranslation();
    useEffect(() => {
        async function fetchCountries() {
            try {
                const API_URL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;
                if (!API_URL) {
                    throw new Error("NEXT_PUBLIC_REST_API_ENDPOINT n'est pas défini !");
                }
                const res = await fetch(`${API_URL}/countries`);
                const data = await res.json();
                setCountries(data);
            } catch (error) {
                console.error('Erreur de chargement des pays:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchCountries();
    }, []);

    return (
        <div className="w-full">
            {loading ? (
                <p>Chargement...</p>
            ) : (
                <select
                    value={value ?? ''}
                    onChange={(e) => onChange?.(parseInt(e.target.value))}
                    required
                    className="w-full px-4 h-12 flex items-center rounded appearance-none transition duration-300 ease-in-out text-black text-sm focus:outline-none focus:ring-0 px-3 py-2 border rounded bg-gray-100 border border-border-base focus:shadow focus:bg-light focus:border-accent"
                >
                    <option value="" disabled>{t('form:input-label-CountrySelect')}</option>
                    {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                            {country.name} ({country.code})
                        </option>
                    ))}
                </select>
            )}

            {/* Affichage drapeau à côté si un pays est sélectionné */}
            {value && (
                <div className="mt-2 flex items-center gap-2">
                    <img
                        src={`https://flagcdn.com/48x36/${getCountryCode(value, countries)}.png`}
                        alt="drapeau"
                        className="w-6 h-auto"
                    />
                    <span>
                        {countries.find((c) => c.id === value)?.name}
                    </span>
                </div>
            )}
        </div>
    );
};

// Fonction pour retrouver le code d’un pays à partir de son ID
function getCountryCode(id: number, countries: Country[]): string {
    const c = countries.find((c) => c.id === id);
    return c?.code?.toLowerCase() ?? '';
}

export default CountrySelect;
