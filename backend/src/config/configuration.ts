export interface AppConfig {
  port: number;
  environment: string;
  apiPrefix: string;
  supabase: {
    url?: string;
    key?: string;
  };
  maxFileSizeMb: number;
}

export const configuration = (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  supabase: {
    url: process.env.SUPABASE_URL || undefined,
    key: process.env.SUPABASE_KEY || undefined,
  },
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
});
