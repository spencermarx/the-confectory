import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';

import { AuthoredFallbacks } from './src/collections/authored-fallbacks.ts';
import { Characters } from './src/collections/characters.ts';
import { ConsequenceTypes } from './src/collections/consequence-types.ts';
import { HolidayEvents } from './src/collections/holiday-events.ts';
import { Moods } from './src/collections/moods.ts';
import { PromptTemplates } from './src/collections/prompt-templates.ts';
import { Props } from './src/collections/props.ts';
import { RejectionCorpus } from './src/collections/rejection-corpus.ts';
import { Shells } from './src/collections/shells.ts';
import { Signs } from './src/collections/signs.ts';
import { Songs } from './src/collections/songs.ts';
import { StyleGuide } from './src/collections/style-guide.ts';
import { TelemetrySignals } from './src/collections/telemetry-signals.ts';
import { Users } from './src/collections/users.ts';

export default buildConfig({
  admin: {
    user: Users.slug,
    // §15.3: the three specialty custom React panels. Each is a
    // client component that talks to the Worker API; Payload's
    // bundler resolves the path strings at admin-build time.
    components: {
      views: {
        moodConsole: {
          Component: '/src/views/MoodConsole',
          path: '/mood-console',
        },
        criticNotebook: {
          Component: '/src/views/CriticNotebook',
          path: '/critics-notebook',
        },
        telemetryDashboard: {
          Component: '/src/views/TelemetryDashboard',
          path: '/telemetry',
        },
      },
    },
  },
  collections: [
    Users,
    Shells,
    Props,
    Characters,
    Songs,
    Signs,
    ConsequenceTypes,
    Moods,
    HolidayEvents,
    AuthoredFallbacks,
    StyleGuide,
    PromptTemplates,
    RejectionCorpus,
    TelemetrySignals,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret-replace-me',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ?? 'postgres://localhost:5432/confectory',
    },
  }),
  typescript: {
    outputFile: './src/payload-types.ts',
  },
});
