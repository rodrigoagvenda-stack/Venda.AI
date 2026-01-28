import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getBrandingByDomain, serializeBranding } from '@/lib/branding'

export async function middleware(request: NextRequest) {
  // Primeiro, atualiza a sessão do Supabase
  const response = await updateSession(request)

  // Pega o host (domínio) da request
  const host = request.headers.get('host') || 'localhost:3000'

  try {
    // Busca branding pelo domínio
    const branding = await getBrandingByDomain(host)

    // Serializa e injeta no header para uso no layout
    const serializedBranding = serializeBranding(branding)
    response.headers.set('x-branding', serializedBranding)
    response.headers.set('x-company-id', String(branding.company_id))
  } catch (error) {
    console.error('Error resolving branding in middleware:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
