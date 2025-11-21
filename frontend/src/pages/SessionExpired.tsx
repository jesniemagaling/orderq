import Nav from '@/components/Nav';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function SessionExpired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav title="Session Expired" />

      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6 text-center px-4">
        <h1 className="text-3xl font-bold text-red-500">Session Expired</h1>
        <p>
          Your session has expired. Please scan the QR code again or start a new
          session.
        </p>
        <Button onClick={() => navigate('/')}>Go Back to Home</Button>
      </div>
    </div>
  );
}
