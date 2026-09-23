import 'dotenv/config';
import { ensureBuiltInPresets } from '../src/lib/built-in-presets.js';
import { prisma } from '../src/lib/db.js';

ensureBuiltInPresets()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
