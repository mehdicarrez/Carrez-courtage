import { Link } from 'react-router-dom';
import { useAuth } from '../../auth';

const modules = [
    {
        to: '/espace-partenaire/demandes', label: 'Demandes', desc: 'Suivre et gérer vos demandes', accent: 'blue',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
            </svg>
        ),
    },
    {
        to: '/espace-partenaire/clients', label: 'Clients', desc: 'Votre répertoire clients', accent: 'indigo',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
        ),
    },
    {
        to: '/espace-partenaire/echeances', label: 'Échéancier', desc: 'Suivi des échéances', accent: 'amber',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
        ),
    },
    {
        to: '/espace-partenaire/commissions', label: 'Commissions', desc: 'Vos commissions', accent: 'emerald',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
        ),
    },
    {
        to: '/espace-partenaire/simulations', label: 'Simulations', desc: 'Simulateur de primes', accent: 'violet',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14.25 12 10.5m0 0 3.75 3.75M12 10.5v9m-6.75 3h13.5a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-3.106a1.5 1.5 0 0 1-1.06-.44L14.06 2.69a1.5 1.5 0 0 0-1.06-.44H7.5a2.25 2.25 0 0 0-2.25 2.25v15.75A2.25 2.25 0 0 0 7.5 21.75h.75ZM6 5.25v15.75" />
            </svg>
        ),
    },
    {
        to: '/espace-partenaire/taches', label: 'Tâches', desc: 'Vos tâches à traiter', accent: 'red',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    },
    {
        to: '/espace-partenaire/messages', label: 'Messagerie', desc: 'Échanger avec Carrez Co', accent: 'blue',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
        ),
    },
    {
        to: '/espace-partenaire/cabinet', label: 'Mon cabinet', desc: 'Gérer votre cabinet', accent: 'slate',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
            </svg>
        ),
    },
];

const accents = {
    blue: 'from-blue-600 to-blue-700',
    red: 'from-red-500 to-red-700',
    indigo: 'from-indigo-600 to-indigo-700',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-orange-600',
    violet: 'from-violet-600 to-purple-700',
    slate: 'from-slate-700 to-slate-900',
};

export default function PartnerHome() {
    const { user } = useAuth();

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Bienvenue{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Votre espace partenaire — retrouvez ici vos demandes, commissions et échéances.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {modules.map((m) => (
                    <Link
                        key={m.to}
                        to={m.to}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br p-px shadow-sm group"
                    >
                        <div className="rounded-2xl bg-white p-5 h-full flex flex-col gap-3 transition-colors group-hover:bg-slate-50">
                            <span className={`h-10 w-10 flex items-center justify-center rounded-xl text-white bg-gradient-to-br ${accents[m.accent] || accents.blue}`}>
                                {m.icon}
                            </span>
                            <div>
                                <div className="font-semibold text-slate-900 group-hover:text-blue-700">{m.label}</div>
                                <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}