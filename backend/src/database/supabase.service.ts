import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('supabase.url');
    const key = this.configService.get<string>('supabase.key');

    if (url && key && url.startsWith('http') && key.length > 10) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: false,
          },
        });
        this.isConfigured = true;
        this.logger.log('🟢 Supabase Client connected and initialized successfully.');
      } catch (err) {
        this.logger.warn(`⚠️ Error initializing Supabase client: ${err.message}. Falling back to resilient repository.`);
        this.isConfigured = false;
      }
    } else {
      this.logger.warn('🟡 Supabase credentials not provided in .env. Running in Resilient In-Memory Mode (All endpoints fully operational for Demo).');
      this.isConfigured = false;
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }
}
