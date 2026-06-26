import { useParams } from 'react-router-dom';
import { JobsListSection } from './JobsPage';

export function ProjectJobsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return null;
  }

  return (
    <JobsListSection
      projectId={projectId}
      title="Translation jobs"
      description="Jobs for this project."
    />
  );
}
