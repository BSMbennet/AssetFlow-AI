import InstitutionalControlPlaneWorkspace from '@/components/control-plane/InstitutionalControlPlaneWorkspace';
import { AuthGate } from '@/components/auth/AuthGate';

export default function InstitutionalPage() {
  return <AuthGate><InstitutionalControlPlaneWorkspace /></AuthGate>;
}
