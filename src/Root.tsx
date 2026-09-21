import App from './App';
import { LandingPage } from './pages/LandingPage';
import { ReferencePage } from './pages/ReferencePage';
import { useRouter } from './router';

export function Root() {
  const { path, navigate } = useRouter();

  if (path.startsWith('/editor')) {
    return <App />;
  }

  if (path.startsWith('/reference')) {
    return <ReferencePage />;
  }

  return <LandingPage onStart={() => navigate('/editor')} />;
}
