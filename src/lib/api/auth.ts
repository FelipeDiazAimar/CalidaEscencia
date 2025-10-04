// @ts-nocheck
// Add missing imports at the top
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { User, ApiResponse } from '@/types/database';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const handleError = (error: any): string => {
  console.error('Auth Error:', error);
  return error?.message || 'An unexpected error occurred';
};

const createResponse = <T>(data: T | null, error: string | null): ApiResponse<T> => ({
  data,
  error,
  success: !error,
});

// =====================================================
// AUTH API
// =====================================================

export const authApi = {
  // Sign up new user
  async signUp(email: string, password: string, userData?: { full_name?: string; phone?: string }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: userData?.full_name,
            phone: userData?.phone,
            role: 'customer' // Default role
          } as any);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Sign in user
  async signIn(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Sign out user
  async signOut(): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        return createResponse({ user, profile }, null);
      }

      return createResponse(null, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: { full_name?: string; phone?: string }): Promise<ApiResponse<User | null>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates as any)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return createResponse(true, null);
    } catch (error) {
      return createResponse(false, handleError(error));
    }
  },

  // Check if user is admin
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      return (profile as any)?.role === 'admin';
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  },

  // Create admin user (server-side only)
  async createAdmin(email: string, password: string, userData: { full_name: string }): Promise<ApiResponse<any>> {
    try {
      // This would typically be done server-side with service role key
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      // Create admin profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: userData.full_name,
            role: 'admin'
          } as any);

        if (profileError) {
          console.error('Admin profile creation error:', profileError);
          throw profileError;
        }
      }

      return createResponse(data, null);
    } catch (error) {
      return createResponse(null, handleError(error));
    }
  },
};

// =====================================================
// AUTH HOOKS AND UTILITIES
// =====================================================

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setProfile(profileData);
        setIsAdmin((profileData as any)?.role === 'admin');
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Get user profile
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setProfile(profileData);
          setIsAdmin((profileData as any)?.role === 'admin');
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    profile,
    isAdmin,
    loading,
    signIn: authApi.signIn,
    signUp: authApi.signUp,
    signOut: authApi.signOut,
    updateProfile: authApi.updateProfile,
    resetPassword: authApi.resetPassword,
    updatePassword: authApi.updatePassword,
  };
};

// =====================================================
// MIDDLEWARE AND GUARDS
// =====================================================

export const useRequireAuth = (redirectTo = '/auth/login') => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
};

export const useRequireAdmin = (redirectTo = '/') => {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push(redirectTo);
    }
  }, [user, isAdmin, loading, router, redirectTo]);

  return { user, isAdmin, loading };
};

// =====================================================
// SERVER-SIDE AUTH UTILITIES
// =====================================================

export const getServerUser = async (cookies: any) => {
  try {
    const supabaseServer = getSupabaseServer();
    
    // Set the auth cookie
    supabaseServer.auth.setSession({
      access_token: cookies.get('sb-access-token')?.value || '',
      refresh_token: cookies.get('sb-refresh-token')?.value || ''
    });

    const { data: { user } } = await supabaseServer.auth.getUser();
    return user;
  } catch (error) {
    console.error('Server auth error:', error);
    return null;
  }
};

export const getServerUserProfile = async (userId: string) => {
  try {
    const supabaseServer = getSupabaseServer();
    
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Server profile error:', error);
    return null;
  }
};