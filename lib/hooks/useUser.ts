import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User as AuthUser } from '@supabase/supabase-js';
import { User, Company } from '@/types/database.types';

export function useUser() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchUserAndCompany(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchUserAndCompany(session.user.id);
      } else {
        setUser(null);
        setCompany(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserAndCompany(authUserId: string) {
    const supabase = createClient();

    try {
      // Primeiro, buscar o usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      if (!userData) {
        console.warn('User not found for auth_user_id:', authUserId);
        setLoading(false);
        return;
      }

      console.log('✅ User found:', userData);
      setUser(userData);

      // Se tem company_id, buscar a empresa
      if (userData.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
        } else if (companyData) {
          console.log('✅ Company found:', companyData);
          setCompany(companyData as any);
        } else {
          console.warn('Company not found for company_id:', userData.company_id);
        }
      } else {
        console.warn('User has no company_id');
      }
    } catch (error) {
      console.error('Error fetching user/company:', error);
    } finally {
      setLoading(false);
    }
  }

  return { authUser, user, company, loading };
}
