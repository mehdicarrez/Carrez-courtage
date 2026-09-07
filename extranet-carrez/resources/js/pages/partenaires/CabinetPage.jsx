import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

export default function CabinetPage() {
    const { user } = useAuth();
    const [organisation, setOrganisation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.organisation_id) {
            setError('Aucune organisation rattachée.');
            setLoading(false);
            return;
        }
        api.get(`/partenaires/${user.organisation_id}`)
            .then((res) => setOrganisation(res.data.data))
            .catch(() => setError('Impossible de charger les informations du cabinet.'))
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div className="text-slate-500">Chargement...</div>;
    if (error) return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>;

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Mon cabinet</h1>

            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-500">Raison sociale :</span>{' '}
                        <strong>{organisation.raison_sociale}</strong>
                    </div>
                    <div>
                        <span className="text-slate-500">SIREN :</span> {organisation.siren || '—'}
                    </div>
                    <div>
                        <span className="text-slate-500">Numéro ORIAS :</span> {organisation.numero_orias || '—'}
                    </div>
                    <div>
                        <span className="text-slate-500">Statut :</span>{' '}
                        {organisation.actif ? (
                            <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">ACTIVE</span>
                        ) : (
                            <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">{organisation.statut}</span>
                        )}
                    </div>
                    <div>
                        <span className="text-slate-500">Date d'activation :</span> {organisation.date_activation || '—'}
                    </div>
                    <div>
                        <span className="text-slate-500">Utilisateurs :</span> {organisation.nb_utilisateurs ?? '—'}
                    </div>
                    <div>
                        <span className="text-slate-500">Dossiers soumis :</span> {organisation.nb_contrats ?? 0}
                    </div>
                </div>
                {organisation.categories_orias?.length > 0 && (
                    <div className="mt-4 text-sm">
                        <span className="text-slate-500">Catégories ORIAS :</span>{' '}
                        {organisation.categories_orias.join(', ')}
                    </div>
                )}
            </div>
        </div>
    );
}