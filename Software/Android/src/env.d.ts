declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL?: string;
    EXPO_PUBLIC_API_URL?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare const require: (moduleName: string) => unknown;
