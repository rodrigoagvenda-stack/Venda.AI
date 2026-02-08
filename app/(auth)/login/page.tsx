'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Shield, User } from 'lucide-react';
import { LogoWhite } from '@/components/Logo';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user');
  const [isChangingMode, setIsChangingMode] = useState(false);

  const handleModeChange = (mode: 'user' | 'admin') => {
    if (mode !== loginMode) {
      setIsChangingMode(true);
      setTimeout(() => {
        setLoginMode(mode);
        setIsChangingMode(false);
      }, 200);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Verificar se é admin
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .single();

        // Validar modo de login
        if (loginMode === 'admin') {
          if (!adminUser) {
            await supabase.auth.signOut();
            throw new Error('Você não tem permissão de administrador');
          }
          toast.success('Bem-vindo, Admin!');
          window.location.href = '/admin';
        } else {
          // Usuários comuns e admins podem acessar o dashboard
          toast.success('Login realizado com sucesso!');
          window.location.href = '/dashboard';
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Frase */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <LogoWhite width={140} height={48} />
          </div>
          <p className="text-sm text-muted-foreground">
            Quem já queimou os barcos 🔥 entra por aqui.
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="space-y-3 pb-4">
            {/* Toggle Admin/Usuário */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('user')}
                disabled={isChangingMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-300 ${
                  loginMode === 'user'
                    ? 'bg-primary text-primary-foreground font-medium scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                } ${isChangingMode ? 'opacity-50' : ''}`}
              >
                <User className="h-4 w-4" />
                Usuário
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('admin')}
                disabled={isChangingMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-300 ${
                  loginMode === 'admin'
                    ? 'bg-primary text-primary-foreground font-medium scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                } ${isChangingMode ? 'opacity-50' : ''}`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={loginMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-10"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-10 text-sm font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </motion.div>
            </AnimatePresence>
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Não tem uma conta? Entre em contato com o admin.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Sistema de CRM com automação e inteligência artificial
        </p>
      </div>
    </div>
  );
}
