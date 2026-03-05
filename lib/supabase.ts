import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdwmimhnrfsvgafxdcph.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JcpF3oBqCMukhTbLet9uRQ_1GY9-xuX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
