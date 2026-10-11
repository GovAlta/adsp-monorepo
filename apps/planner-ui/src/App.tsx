import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  GoAMicrositeHeader,
  GoAAppHeader,
  GoAAppHeaderMenu,
  GoAOneColumnLayout,
  GoAAppFooter,
  GoAAppFooterNavSection,
  GoAAppFooterMetaSection,
} from '@abgov/react-components';
import SessionDashboard from './pages/SessionDashboard';
import NewSessionStart from './pages/NewSessionStart';
import PlanningSession from './pages/PlanningSession';
import BusinessModelReview from './pages/BusinessModelReview';
import HypothesisReview from './pages/HypothesisReview';
import SessionExport from './pages/SessionExport';
import AdminHub from './pages/AdminHub';
import PatternLibrary from './pages/PatternLibrary';
import PatternEditor from './pages/PatternEditor';
import PatternDetail from './pages/PatternDetail';
import SessionHistory from './pages/SessionHistory';
import AuditLog from './pages/AuditLog';
import UserManagement from './pages/UserManagement';
import SpecialistChat from './pages/SpecialistChat';

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <GoAMicrositeHeader type="alpha" version="0.1 — Local Dev" />
      <GoAAppHeader url="/" heading="ADSP Project Planner">
        <GoAAppHeaderMenu heading="Sessions" leadingIcon="people">
          <a href="/sessions">My Sessions</a>
          <a href="/sessions/new">Start New Session</a>
          <a href="/patterns">Browse Patterns</a>
        </GoAAppHeaderMenu>
        {isAdmin && (
          <GoAAppHeaderMenu heading="Admin" leadingIcon="settings">
            <a href="/admin">Admin Hub</a>
            <a href="/admin/patterns">Manage Patterns</a>
            <a href="/admin/history">Session History</a>
            <a href="/admin/audit">Audit Log</a>
            <a href="/admin/users">User Management</a>
          </GoAAppHeaderMenu>
        )}
      </GoAAppHeader>

      <GoAOneColumnLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/sessions" replace />} />
          <Route path="/sessions" element={<SessionDashboard />} />
          <Route path="/sessions/new" element={<NewSessionStart />} />
          <Route path="/sessions/:sessionId" element={<PlanningSession />} />
          <Route path="/sessions/:sessionId/planning" element={<PlanningSession />} />
          <Route path="/sessions/:sessionId/business-model" element={<BusinessModelReview />} />
          <Route path="/sessions/:sessionId/hypothesis" element={<HypothesisReview />} />
          <Route path="/sessions/:sessionId/export" element={<SessionExport />} />
          <Route path="/sessions/:sessionId/specialists/:type" element={<SpecialistChat />} />
          <Route path="/patterns" element={<PatternLibrary readOnly />} />
          <Route path="/admin" element={<AdminHub />} />
          <Route path="/admin/patterns" element={<PatternLibrary />} />
          <Route path="/admin/patterns/:patternId/view" element={<PatternDetail />} />
          <Route path="/admin/patterns/:patternId" element={<PatternEditor />} />
          <Route path="/admin/history" element={<SessionHistory />} />
          <Route path="/admin/audit" element={<AuditLog />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Routes>
      </GoAOneColumnLayout>

      <GoAAppFooter>
        <GoAAppFooterNavSection heading="ADSP Project Planner" maxColumnCount={2}>
          <a href="/sessions">My Sessions</a>
          <a href="/sessions/new">Start Planning</a>
          <a href="/admin">Admin</a>
        </GoAAppFooterNavSection>
        <GoAAppFooterMetaSection>
          <a href="https://www.alberta.ca/disclaimer.aspx">Disclaimer</a>
          <a href="https://www.alberta.ca/privacystatement.aspx">Privacy</a>
          <a href="https://www.alberta.ca/accessibility.aspx">Accessibility</a>
        </GoAAppFooterMetaSection>
      </GoAAppFooter>
    </>
  );
}

// ✓ ASVS:V-4.1.1 — every route is behind Keycloak OIDC (check-sso in main.tsx)
export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
