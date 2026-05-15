#!/usr/bin/env node
import { validateAll } from './commands/validate.ts';

const [, , command, ...args] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'validate-all':
      await validateAll();
      return;
    case 'upload':
      console.error('upload: not implemented in Phase 1 scaffold');
      process.exit(2);
      return;
    default:
      console.error(`unknown command: ${command ?? '(none)'}`);
      console.error('usage: confectory-shell <validate-all|upload> [args]');
      process.exit(2);
  }
  void args;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
