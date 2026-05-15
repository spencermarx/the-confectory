import { shellSchema } from '@confectory/shared';
import { phase1Shells } from '@confectory/shells';

// §20.2: CI runs this. Every shell in packages/shells/ is validated.
// The defineShell() call already parses through the schema; this re-runs
// it for paranoia and reports a summary.
export async function validateAll(): Promise<void> {
  let failures = 0;
  for (const [id, shell] of phase1Shells.entries()) {
    const result = shellSchema.safeParse(shell);
    if (result.success) {
      console.log(`  ok  ${id}`);
    } else {
      failures++;
      console.error(`fail  ${id}`);
      for (const issue of result.error.issues) {
        console.error(`        ${issue.path.join('.')}: ${issue.message}`);
      }
    }
  }
  console.log(`\n${phase1Shells.size - failures} ok, ${failures} fail`);
  if (failures > 0) process.exit(1);
}
