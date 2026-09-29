import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class SupabaseOrJwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = String(request.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const supabaseUrl = String(request.headers['x-supabase-url'] || '').replace(/\/$/, '');
    const anonKey = String(request.headers['x-supabase-anon-key'] || '');
    if (!token || !supabaseUrl || !anonKey) throw new UnauthorizedException('A valid Supabase session is required for blockchain issuance');

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
      });
    } catch {
      throw new UnauthorizedException('Supabase session validation failed');
    }
    if (!response.ok) throw new UnauthorizedException('Invalid Supabase session');

    const user = await response.json() as { id?: string; email?: string };
    if (!user.id) throw new UnauthorizedException('Invalid Supabase user');
    request.user = { id: user.id, email: user.email, role: 'SUPABASE_AUTHENTICATED' };
    return true;
  }
}
