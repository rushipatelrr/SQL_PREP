import { LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useMe, useLogout } from '@/hooks/useAuth';
import { goToGoogleSignIn } from '@/api/auth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-5">
      <div className="text-[15px] font-semibold tracking-tight">
        <b className="text-amber">SQL</b> <span className="text-text-dim">PREP</span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-2.5">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-7 w-7 rounded-full border border-line" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-panel2 text-xs font-semibold text-text-dim">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden text-sm text-text-dim sm:inline">{user.name}</span>
            <button
              onClick={() => logoutMutation.mutate()}
              aria-label="Sign out"
              className="text-text-dim transition-colors hover:text-red"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button onClick={goToGoogleSignIn} className="text-[13px]">
            Continue with Google
          </Button>
        )}
      </div>
    </header>
  );
}
