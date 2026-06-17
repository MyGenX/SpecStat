import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const actionsDir = join(__dirname, '../../../actions')
const outFile = join(__dirname, '../src/generatedWorkflows.ts')

const files = [
  ['INIT_YAML', 'specstat-init.yml'],
  ['SYNC_YAML', 'specstat-sync.yml'],
  ['VALIDATE_YAML', 'specstat-validate.yml'],
  ['BASELINE_YAML', 'specstat-baseline.yml'],
  ['CLEAN_YAML', 'specstat-clean.yml'],
]

const lines = [
  '// AUTO-GENERATED — do not edit directly.',
  '// Source: actions/*.yml in the repo root.',
  '// Run `npm run generate` in packages/github-client to regenerate.',
  '',
  ...files.map(([name, file]) => {
    const content = readFileSync(join(actionsDir, file), 'utf-8')
    return `export const ${name} = ${JSON.stringify(content)}`
  }),
]

writeFileSync(outFile, lines.join('\n') + '\n')
console.log(`Generated src/generatedWorkflows.ts from ${files.length} action files`)
