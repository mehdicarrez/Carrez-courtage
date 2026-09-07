import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function DevisList() {
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/demandes?statut=DEVIS_EMIS')
            .then((res) => setDemandes(res.data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Devis en attente</h1>
            {loading && <div className="text-slate-500">Chargement...</div>}
            {!loading && demandes.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    Aucun devis en attente.
                </div>
            )}
            <div className="space-y-3">
                {demandes.map((d) => (
                    <Link
                        key={d.id}
                        to={`/demandes/${d.id}`}
                        className="block bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm"
                    >
                        <div className="font-medium text-slate-900">{d.reference}</div>
                        <div className="text-sm text-slate-500 mt-1">
                            {d.branche} — {d.client}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
