import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, estPartenaire } from './auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DemandesList from './pages/demandes/DemandesList';
import NouvelleDemande from './pages/demandes/NouvelleDemande';
import DemandeDetail from './pages/demandes/DemandeDetail';
import ClientsPage from './pages/clients/ClientsPage';
import ClientInfos from './pages/clients/ClientInfos';
import DevisList from './pages/devis/DevisList';
import SaisieDevis from './pages/devis/SaisieDevis';
import ContratsList from './pages/contrats/ContratsList';
import ContratDetail from './pages/contrats/ContratDetail';
import EcheancesPage from './pages/contrats/EcheancesPage';
import CommissionsPage from './pages/commissions/CommissionsPage';
import SimulationsPage from './pages/simulations/SimulationsPage';
import TachesPage from './pages/taches/TachesPage';
import PartenairesList from './pages/admin/PartenairesList';
import PartenaireDetail from './pages/admin/PartenaireDetail';
import FournisseursList from './pages/admin/FournisseursList';
import UtilisateursList from './pages/admin/UtilisateursList';
import AuditPage from './pages/admin/AuditPage';
import ReferentielsPage from './pages/admin/ReferentielsPage';
import PilotagePage from './pages/admin/PilotagePage';
import EmailsPage from './pages/admin/EmailsPage';
import ConfirmationsList from './pages/admin/ConfirmationsList';
import MessagesPage from './pages/messages/MessagesPage';
import CabinetPage from './pages/partenaires/CabinetPage';
import Layout from './components/Layout';
import PartnerLayout from './components/PartnerLayout';
import PartnerHome from './pages/partenaires/PartnerHome';
import DevisPartenaire from './pages/partenaires/DevisPartenaire';

function Protected({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <div className="p-10 text-center">Chargement...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (estPartenaire(user) && location.pathname === '/') return <Navigate to="/espace-partenaire" replace />;
    return children;
}

function PartnerProtected({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-10 text-center">Chargement...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (!estPartenaire(user)) return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <Protected>
                        <Layout />
                    </Protected>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="demandes" element={<DemandesList />} />
                <Route path="demandes/nouvelle" element={<NouvelleDemande />} />
                <Route path="demandes/:id" element={<DemandeDetail />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="clients/:id" element={<ClientInfos />} />
                <Route path="devis" element={<DevisList />} />
                <Route path="demandes/:id/devis" element={<SaisieDevis />} />
                <Route path="contrats" element={<ContratsList />} />
                <Route path="contrats/:id" element={<ContratDetail />} />
                <Route path="echeances" element={<EcheancesPage />} />
                <Route path="commissions" element={<CommissionsPage />} />
                <Route path="simulations" element={<SimulationsPage />} />
                <Route path="taches" element={<TachesPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="cabinet" element={<CabinetPage />} />
                <Route path="partenaires" element={<PartenairesList />} />
                <Route path="partenaires/:id" element={<PartenaireDetail />} />
                <Route path="fournisseurs" element={<FournisseursList />} />
                <Route path="utilisateurs" element={<UtilisateursList />} />
                <Route path="audit" element={<AuditPage />} />
                <Route path="referentiels" element={<ReferentielsPage />} />
                <Route path="pilotage" element={<PilotagePage />} />
                <Route path="emails" element={<EmailsPage />} />
                <Route path="confirmations" element={<ConfirmationsList />} />
            </Route>
            <Route
                path="/espace-partenaire"
                element={
                    <PartnerProtected>
                        <PartnerLayout />
                    </PartnerProtected>
                }
            >
                <Route index element={<PartnerHome />} />
                <Route path="demandes" element={<DemandesList />} />
                <Route path="demandes/nouvelle" element={<NouvelleDemande />} />
                <Route path="demandes/:id" element={<DemandeDetail />} />
                <Route path="demandes/:id/devis" element={<SaisieDevis />} />
                <Route path="devis" element={<DevisPartenaire />} />
                <Route path="contrats" element={<ContratsList />} />
                <Route path="contrats/:id" element={<ContratDetail />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="echeances" element={<EcheancesPage />} />
                <Route path="commissions" element={<CommissionsPage />} />
                <Route path="simulations" element={<SimulationsPage />} />
                <Route path="taches" element={<TachesPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="cabinet" element={<CabinetPage />} />
            </Route>
        </Routes>
    );
}

export default function Main() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
