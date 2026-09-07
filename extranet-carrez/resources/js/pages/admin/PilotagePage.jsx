import { useCallback, useEffect, useState } from 'react';
import api from '../../api';

const fmt = (cts) => ((cts ?? 0) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export default function PilotagePage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [annee, setAnnee] = useState(String(new Date().getFullYear()));

    const load = useCallback(async () => {
        setLoading(true);
        setMsg('');
        try {
            const params = {};
            if (annee) params.depuis = `${annee}-01-01`;
            const res = await api.get('/pilotage', { params });
            setData(res.data.data);
        } catch (e) {
            setMsg(e.status === 403 ? 'Accès réservé à la direction.' : 'Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    }, [annee]);

    useEffect(() => { load(); }, [load]);

    const exporter = async () => {
        try {
            const res = await api.get('/pilotage/export', { params: { depuis: data?.periode_debut }, responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pilotage.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setMsg('Erreur d\'export.');
        }
    };

    if (loading) return <div className="text-slate-500">Chargement...</div>;
    if (!data) return <div className="bg-red-50 text-red-700 p-4 rounded">{msg || 'Données indisponibles.'}</div>;

    const cartes = [
        ['Volume demandes', data.volume_demandes],
        ['Taux transformation', data.taux_transformation + ' %'],
        ['Contrats émis', data.contrats_emis],
        ['Primés placées HT', fmt(data.primes_placees_ht)],
        ['Prime moyenne HT', fmt(data.prime_moyenne_ht)],
        ['Commission rétrocédée', fmt(data.commission_retrocedee)],
        ['Commission perçue', fmt(data.commission_percue)],
        ['Taux de chute 12m', data.taux_chute_12m + ' %'],
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-slate-900">Pilotage (§10.3)</h1>
                <div className="flex items-center gap-2">
                    <select value={annee} onChange={(e) => setAnnee(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 text-sm">
                        {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={exporter} className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800">Exporter CSV</button>
                </div>
            </div>

            {msg && <div className="bg-amber-50 text-amber-700 p-3 rounded mb-4 text-sm">{msg}</div>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {cartes.map(([label, v], i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
                        <div className="text-xl font-bold text-slate-900 mt-1">{v}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <h3 className="font-medium text-slate-900 px-4 py-3 border-b border-slate-100 text-sm">Répartition par branche</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-left">
                            <tr>
                                <th className="px-4 py-2">Branche</th>
                                <th className="px-4 py-2 text-right">Contrats</th>
                                <th className="px-4 py-2 text-right">Primes HT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.repartition_branches || []).map((b) => (
                                <tr key={b.branche} className="border-t border-slate-100">
                                    <td className="px-4 py-2">{b.branche}</td>
                                    <td className="px-4 py-2 text-right">{b.contrats}</td>
                                    <td className="px-4 py-2 text-right">{fmt(b.primes_ht)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <h3 className="font-medium text-slate-900 px-4 py-3 border-b border-slate-100 text-sm">Répartition par partenaire</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-left">
                            <tr>
                                <th className="px-4 py-2">Partenaire</th>
                                <th className="px-4 py-2 text-right">Contrats</th>
                                <th className="px-4 py-2 text-right">Primes HT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.repartition_partenaires || []).map((p) => (
                                <tr key={p.partenaire} className="border-t border-slate-100">
                                    <td className="px-4 py-2">{p.partenaire}</td>
                                    <td className="px-4 py-2 text-right">{p.contrats}</td>
                                    <td className="px-4 py-2 text-right">{fmt(p.primes_ht)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <h3 className="font-medium text-slate-900 px-4 py-3 border-b border-slate-100 text-sm">Top partenaires (net payé)</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-left">
                            <tr>
                                <th className="px-4 py-2">Partenaire</th>
                                <th className="px-4 py-2 text-right">Net payé</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.top_partenaires || []).map((p, i) => (
                                <tr key={i} className="border-t border-slate-100">
                                    <td className="px-4 py-2">{p.partenaire}</td>
                                    <td className="px-4 py-2 text-right">{fmt(p.net_paye)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
