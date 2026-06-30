import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { ProjectExportPage } from '../../features/export/pages/ProjectExportPage';
import { ProjectSettingsPage } from '../../features/project-settings/pages/ProjectSettingsPage';
import { ProjectApprovalsPage } from '../../features/approvals/pages/ProjectApprovalsPage';
import { ProjectDetailLayout } from '../../features/projects/pages/ProjectDetailLayout';
import { ProjectKeysPage } from '../../features/translation-keys/pages/ProjectKeysPage';
import { ProjectOverviewTab } from '../../features/projects/pages/ProjectOverviewTab';
import { ProjectsPage } from '../../features/projects/pages/ProjectsPage';
import { AnalyticsPage } from '../../features/analytics/pages/AnalyticsPage';
import { AuditLogsPage } from '../../features/audit/pages/AuditLogsPage';
import { JobDetailPage } from '../../features/translation-jobs/pages/JobDetailPage';
import { JobsPage } from '../../features/translation-jobs/pages/JobsPage';
import { ProjectBranchesPage } from '../../features/branches/pages/ProjectBranchesPage';
import { ProjectGlossaryPage } from '../../features/glossary/pages/ProjectGlossaryPage';
import { ProjectObjectsPage } from '../../features/localization-objects/pages/ProjectObjectsPage';
import { ProjectObjectDetailPage } from '../../features/localization-objects/pages/ProjectObjectDetailPage';
import { ProjectJobsPage } from '../../features/translation-jobs/pages/ProjectJobsPage';
import { ProjectTranslationsPage } from '../../features/translations/pages/ProjectTranslationsPage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';

function EntityObjectRedirect() {
  const { projectId, objectId } = useParams<{
    projectId: string;
    objectId: string;
  }>();
  return (
    <Navigate
      to={`/projects/${projectId}/entities/${objectId}`}
      replace
    />
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailLayout />}>
            <Route index element={<ProjectOverviewTab />} />
            <Route path="keys" element={<ProjectKeysPage />} />
            <Route path="translations" element={<ProjectTranslationsPage />} />
            <Route path="entities" element={<ProjectObjectsPage />} />
            <Route
              path="entities/:objectId"
              element={<ProjectObjectDetailPage />}
            />
            <Route path="objects" element={<Navigate to="entities" replace />} />
            <Route
              path="objects/:objectId"
              element={<EntityObjectRedirect />}
            />
            <Route path="glossary" element={<ProjectGlossaryPage />} />
            <Route path="branches" element={<ProjectBranchesPage />} />
            <Route path="jobs" element={<ProjectJobsPage />} />
            <Route path="approvals" element={<ProjectApprovalsPage />} />
            <Route path="export" element={<ProjectExportPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
