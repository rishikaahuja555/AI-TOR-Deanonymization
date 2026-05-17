import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utjilgbpuyhjbrytofgs.supabase.co';
const supabaseAnonKey = 'sb_publishable_ClGC4xGTFYB4jqU6bMiS8A_uSASQ6eL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
