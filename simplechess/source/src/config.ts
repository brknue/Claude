/**
 * Site configuration. Fill in after creating the Supabase project (see supabase/README.md).
 * The anon key is public by design: the database only allows what supabase/schema.sql permits.
 */
export const SUPABASE_URL = 'https://pwrmrjxrxpmftzeptytq.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_KNY5G20ZQgWEOq-uRR4NkQ_P3RJjOdb';

/** Shown in the privacy policy as the responsible operator (GDPR Art. 13). */
export const OPERATOR_NAME = 'Crb';
export const OPERATOR_CONTACT = '88crab88@gmail.com';

/** Bump when the privacy policy or terms change materially. */
/** newest Android app (versionCode in android/AndroidManifest.xml); written to version.json at build time */
export const ANDROID_APP_VERSION = 1;
/** direct APK download that also works from inside the Android app (it opens the browser to download) */
export const APK_DOWNLOAD = 'https://github.com/brknue/Claude/raw/main/simplechess/simplechess.apk';

export const POLICY_VERSION = '1';
export const POLICY_DATE = '2026-11-20';
