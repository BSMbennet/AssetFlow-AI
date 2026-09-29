import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
export class SupabaseOrJwtGuard implements CanActivate {
  constructor(private readonly jwtGuard: JwtAuthGuard, private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await Promise.resolve(this.jwtGuard.canActivate(context));
      if (result) return true;
    } catch {
      // Fall through to Supabase session validation for the web app.
    }

    if (this.config.get<string>('ENABLE_SUPABASE_ISSUANCE') !== 'true') {
      throw new UnauthorizedException('Blockchain issuance requires an authenticated API session');
    }

    const request = context.switchToHttp().getRequest();
    const auth = String(request.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const supabaseUrl = this.config.get<string>('SUPABASE_URL') || this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY') || this.config.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!token || !supabaseUrl || !anonKey) throw new UnauthorizedException('Supabase issuance authentication is not configured');

    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!response.ok) throw new UnauthorizedException('Invalid Supabase session');

    const user = await response.json() as { id?: string; email?: string };
    if (!user.id) throw new UnauthorizedException('Invalid Supabase user');
    request.user = { id: user.id, email: user.email, role: 'SUPABASE_AUTHENTICATED' };
    return true;
  }
}
