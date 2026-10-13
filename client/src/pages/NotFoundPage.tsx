import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-20 text-center">
      <p className="text-5xl font-semibold text-line">404</p>
      <p className="text-text-dim">That page doesn&apos;t exist.</p>
      <Link to="/dashboard">
        <Button variant="ghost">Back to dashboard</Button>
      </Link>
    </div>
  );
}
