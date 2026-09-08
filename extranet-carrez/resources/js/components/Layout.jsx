import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth';

const Icones = {
    accueil: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
        </svg>
    ),
    demandes: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
        </svg>
    ),
    clients: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
    ),
    devis: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    ),
    contrats: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
    ),
    echeances: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
    ),
    commissions: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
    ),
    simulations: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14.25 12 10.5m0 0 3.75 3.75M12 10.5v9m-6.75 3h13.5a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-3.106a1.5 1.5 0 0 1-1.06-.44L14.06 2.69a1.5 1.5 0 0 0-1.06-.44H7.5a2.25 2.25 0 0 0-2.25 2.25v15.75A2.25 2.25 0 0 0 7.5 21.75h.75ZM6 5.25v15.75" />
        </svg>
    ),
    taches: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    ),
    messages: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
    ),
    cabinet: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
    ),
    partenaires: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
    ),
    utilisateurs: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
    ),
    confirmations: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
        </svg>
    ),
    audit: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
    ),
    pilotage: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
    ),
    referentiels: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125S3.75 14.278 3.75 12" />
        </svg>
    ),
    emails: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
    ),
    autre: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
    ),
};

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const estCabinet = user && ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user.role);
    const estAdmin = user?.role === 'ADMIN';

    const partenaireNav = [
        { to: '/', label: 'Accueil', end: true, icon: 'accueil' },
        { to: '/demandes', label: 'Demandes', icon: 'demandes' },
        { to: '/clients', label: 'Clients', icon: 'clients' },
        { to: '/echeances', label: 'Échéancier', icon: 'echeances' },
        { to: '/commissions', label: 'Commissions', icon: 'commissions' },
        { to: '/simulations', label: 'Simulations', icon: 'simulations' },
        { to: '/taches', label: 'Tâches', icon: 'taches' },
        { to: '/messages', label: 'Messagerie', icon: 'messages' },
        { to: '/cabinet', label: 'Mon cabinet', icon: 'cabinet' },
        { to: '/utilisateurs', label: 'Mes utilisateurs', icon: 'utilisateurs', admin: user?.role === 'DIRIGEANT_PARTENAIRE' },
    ];

    const cabinetNav = [
        { to: '/', label: 'Accueil', end: true, icon: 'accueil' },
        { to: '/demandes', label: 'Demandes', icon: 'demandes' },
        { to: '/clients', label: 'Clients', icon: 'clients' },
        { to: '/devis', label: 'Devis', icon: 'devis' },
        { to: '/contrats', label: 'Contrats', icon: 'contrats' },
        { to: '/echeances', label: 'Échéancier', icon: 'echeances' },
        { to: '/commissions', label: 'Commissions', icon: 'commissions' },
        { to: '/simulations', label: 'Simulations', icon: 'simulations' },
        { to: '/taches', label: 'Tâches', icon: 'taches' },
        { to: '/fournisseurs', label: 'Partenaires', icon: 'partenaires' },
        { to: '/confirmations', label: 'Confirmations', icon: 'confirmations' },
        { to: '/pilotage', label: 'Pilotage', icon: 'pilotage', admin: true },
    ];

    const autreItems = [
        { to: '/messages', label: 'Messagerie', icon: 'messages' },
        { to: '/utilisateurs', label: 'Utilisateurs', icon: 'utilisateurs', admin: true },
        { to: '/emails', label: 'E-mails', icon: 'emails' },
        { to: '/referentiels', label: 'Référentiels', icon: 'referentiels', admin: true },
        { to: '/audit', label: 'Audit', icon: 'audit', admin: true },
    ];

    const nav = estCabinet ? cabinetNav.filter((n) => n.admin === undefined || n.admin === estAdmin)
        : partenaireNav.filter((n) => n.admin === undefined || n.admin === true);

    const filteredAutreItems = autreItems.filter((n) => n.admin === undefined || n.admin === estAdmin);
    const [autreOpen, setAutreOpen] = useState(false);
    const [autrePos, setAutrePos] = useState({ top: 0, left: 0 });
    const autreBtnRef = useRef(null);
    const autreRef = useRef(null);

    const toggleAutre = () => {
        if (autreBtnRef.current) {
            const rect = autreBtnRef.current.getBoundingClientRect();
            setAutrePos({ top: rect.bottom + 2, left: rect.left });
        }
        setAutreOpen((v) => !v);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (autreRef.current && !autreRef.current.contains(e.target) &&
                autreBtnRef.current && !autreBtnRef.current.contains(e.target)) {
                setAutreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = user?.name
        ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
        : '??';

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* HEADER : ligne 1 = logo + icônes, ligne 2 = menu */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                {/* Ligne 1 : logo + icônes */}
                <div className="h-16 max-w-full px-4 xl:px-10 flex items-center gap-4">
                    <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                            CC
                        </div>
                        <div className="leading-tight hidden sm:block">
                            <div className="font-extrabold text-slate-900 tracking-tight">Carrez Co</div>
                            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Courtage</div>
                        </div>
                    </NavLink>

                    {/* Icônes à droite */}
                    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                        <button
                            className="p-2 rounded-full text-slate-500 hover:text-blue-700 hover:bg-gray-100"
                            title="Aide"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                            </svg>
                        </button>
                        <button className="relative p-2 rounded-full text-slate-500 hover:text-blue-700 hover:bg-gray-100" title="Notifications">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 inline-block w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">99</span>
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
                        <NavLink
                            to="/cabinet"
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100"
                            title={user?.name}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-bold text-xs shadow">
                                {initials}
                            </div>
                            <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                                {user?.name}
                            </span>
                        </NavLink>
                    </div>
                </div>

                {/* Ligne 2 : menu de navigation */}
                <div className="border-t border-gray-200">
                    <div className="max-w-full px-4 xl:px-10 flex items-center gap-0.5 overflow-x-auto">
                        {nav.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                        isActive
                                            ? 'text-blue-700 border-blue-600 bg-blue-50/50'
                                            : 'text-slate-600 border-transparent hover:text-blue-700 hover:bg-gray-100'
                                    }`
                                }
                            >
                                <span className="text-slate-400">{Icones[item.icon]}</span>
                                {item.label}
                            </NavLink>
                        ))}
                        {/* Dropdown "Autre" */}
                        {estCabinet && filteredAutreItems.length > 0 && (
                            <div className="relative">
                                <button
                                    ref={autreBtnRef}
                                    onClick={toggleAutre}
                                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 border-transparent text-slate-600 hover:text-blue-700 hover:bg-gray-100"
                                >
                                    <span className="text-slate-400">{Icones.autre}</span>
                                    Autre
                                    <svg className={`w-3 h-3 ml-0.5 transition-transform ${autreOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {autreOpen && createPortal(
                                    <div ref={autreRef} className="fixed z-[9999] w-52 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
                                        style={{ top: autrePos.top, left: autrePos.left }}>
                                        {filteredAutreItems.map((item) => (
                                            <NavLink
                                                key={item.to}
                                                to={item.to}
                                                onClick={() => setAutreOpen(false)}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                                                        isActive
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'text-slate-600 hover:bg-gray-50 hover:text-blue-700'
                                                    }`
                                                }
                                            >
                                                <span className="text-slate-400">{Icones[item.icon]}</span>
                                                {item.label}
                                            </NavLink>
                                        ))}
                                    </div>,
                                    document.body
                                )}
                            </div>
                        )}
                        <button
                            onClick={async () => {
                                await logout();
                                navigate('/login');
                            }}
                            className="ml-auto flex items-center gap-1.5 px-3 py-2.5 rounded text-sm font-medium text-red-600 hover:bg-red-50 whitespace-nowrap lg:hidden"
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-full w-full p-4 md:p-6 xl:px-10 xl:py-8">
                <Outlet />
            </main>

            <footer className="bg-white border-t border-gray-200 py-3">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                    <span>© {new Date().getFullYear()} Carrez Co Courtage — Extranet partenaires</span>
                    <button
                        onClick={async () => {
                            await logout();
                            navigate('/login');
                        }}
                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                        </svg>
                        Se déconnecter
                    </button>
                </div>
            </footer>
        </div>
    );
}
