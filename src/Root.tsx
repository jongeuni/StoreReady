import App from './App';
import { LandingPage } from './pages/LandingPage';
import { useRouter } from './router';

export function Root() {
  const { path, navigate } = useRouter();

  if (path.startsWith('/editor')) {
    return <App />;
  }

  return <LandingPage onStart={() => navigate('/editor')} />;
}
