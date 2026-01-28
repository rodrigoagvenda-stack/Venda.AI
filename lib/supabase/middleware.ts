import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Extrair o host para white label
  const host = request.headers.get('host') || '';

  // Criar headers modificados com o host
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-host', host);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Passar o host como header na response também
  response.headers.set('x-host', host);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Apenas refresh o session sem fetch pesado
  // O getUser() real é feito nos layouts quando necessário
  const { data: { session } } = await supabase.auth.getSession()

  return response
}
