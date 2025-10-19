import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ChangePasswordInput,
} from "@workspace/validation";
import { authService } from "./service";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (credentials: LoginInput) => Promise<void>;
  signUp: (credentials: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (data: ForgotPasswordInput) => Promise<void>;
  updatePassword: (data: ChangePasswordInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("Error getting session:", error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get session:", error);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setSession(session);
      setUser(session?.user ?? null);

      // Ensure loading is false after any auth state change
      if (loading) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: LoginInput) => {
    const data = await authService.signIn(credentials);
    setSession(data.session);
    setUser(data.user);
  };

  const signUp = async (credentials: RegisterInput) => {
    const data = await authService.signUp(credentials);
    setSession(data.session);
    setUser(data.user);
  };

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
  };

  const resetPassword = async (data: ForgotPasswordInput) => {
    await authService.resetPassword(data);
  };

  const updatePassword = async (data: ChangePasswordInput) => {
    await authService.updatePassword(data);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
