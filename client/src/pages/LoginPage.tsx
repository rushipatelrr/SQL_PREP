import { Navigate, useSearchParams } from 'react-router-dom';
import { useMe } from '@/hooks/useAuth';
import { goToGoogleSignIn } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function LoginPage() {
  const { data: user, isLoading } = useMe();
  const [params] = useSearchParams();
  const authFailed = params.get('error') === 'auth_failed';

  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex h-screen flex-col bg-ink text-text">
      <div className="flex justify-end p-5">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            <b className="text-amber">SQL</b> <span className="text-text-dim">PREP</span>
          </h1>
          <p className="mt-3 text-[15px] text-text-dim">Learn SQL by writing real queries against real data.</p>

          {authFailed && (
            <p className="mt-5 rounded-card border border-red/30 bg-red/10 px-4 py-2.5 text-sm text-red">
              Sign-in didn&apos;t go through. Please try again.
            </p>
          )}

          <Button onClick={goToGoogleSignIn} className="mt-7 w-full py-2.5">
            Continue with Google
          </Button>

          <p className="mt-5 text-xs text-text-dim">Your progress is saved to your account and picks up right where you left off, on any device.</p>
        </div>
      </div>
    </div>
  );
}
