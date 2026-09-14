import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

export default function CabinetPage() {
    const { user } = useAuth();
    const [organisation, setOrganisation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

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

    const onLogoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError('');
        const fd = new FormData();
        fd.append('logo', file);
        try {
            const res = await api.post(`/partenaires/${organisation.id}/logo`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setOrganisation((prev) => ({ ...prev, ...res.data.data }));
        } catch {
            setError("Échec de l'envoi du logo.");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    if (loading) return <div className="text-slate-500">Chargement...</div>;
    if (error) return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>;

    const initials = organisation?.raison_sociale
        ? organisation.raison_sociale.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
        : '??';

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Mon cabinet</h1>

            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-start gap-5 mb-5">
                    {/* Logo / placeholder */}
                    <div className="relative flex-shrink-0 group">
                        {organisation.logo_url ? (
                            <img
                                src={organisation.logo_url}
                                alt="Logo"
                                className="w-20 h-20 rounded-xl object-contain border border-slate-200 bg-white p-1"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold border border-dashed border-blue-300">
                                {initials}
                            </div>
                        )}

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onLogoChange}
                        />

                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            title={organisation.logo_url ? 'Changer le logo' : 'Ajouter un logo'}
                        >
                            {uploading ? (
                                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m6.36-.64-2.12 2.12M21 12h-3m.64 6.36-2.12-2.12M12 21v-3m-6.36.64 2.12-2.12M3 12h3m-.64-6.36 2.12 2.12" /></svg>
                            ) : (
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                            )}
                        </button>
                    </div>

                    <div>
                        <div className="text-sm text-slate-500">Logo</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                            {organisation.logo_url ? 'Cliquer sur l\'icône pour changer.' : 'Aucun logo. Cliquer sur l\'icône pour en ajouter un.'}
                        </div>
                    </div>
                </div>

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