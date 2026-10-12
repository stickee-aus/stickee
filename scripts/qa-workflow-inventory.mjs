import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const sourceRoots = ['src/app', 'src/components']
const outputPath = path.join(root, 'docs/qa/workflow-source-inventory.json')

function walk(directory) {
  return readdirSync(directory)
    .flatMap(name => {
      const absolute = path.join(directory, name)
      return statSync(absolute).isDirectory() ? walk(absolute) : [absolute]
    })
    .filter(file => /\.(tsx|ts)$/.test(file) && !file.endsWith('.bak'))
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/')
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

function clean(value) {
  return value?.replace(/\s+/g, ' ').trim() || null
}

function extractControls(file) {
  const source = readFileSync(file, 'utf8')
  const controls = []
  const tagPattern = /<(button|a|Link|form|input|select|textarea|dialog)\b([^>]*)>([\s\S]*?)(?:<\/\1>|$)|<(input)\b([^>]*)\/?\s*>/g
  let match

  while ((match = tagPattern.exec(source))) {
    const type = match[1] || match[4]
    const attrs = match[2] || match[5] || ''
    const body = match[3] || ''
    const href = attrs.match(/href=(?:"([^"]+)"|'([^']+)'|\{([^}]+)\})/)?.slice(1).find(Boolean)
    const ariaLabel = attrs.match(/aria-label=(?:"([^"]+)"|'([^']+)')/)?.slice(1).find(Boolean)
    const placeholder = attrs.match(/placeholder=(?:"([^"]+)"|'([^']+)')/)?.slice(1).find(Boolean)
    const handler = attrs.match(/(onClick|onSubmit|onChange)=\{([^}]+)\}/)
    const text = clean(body.replace(/<[^>]+>/g, ' ').replace(/\{[^}]+\}/g, ' '))

    controls.push({
      type,
      line: lineNumber(source, match.index),
      label: clean(ariaLabel || text || placeholder) || '(dynamic or icon-only)',
      href: clean(href),
      handler: handler ? clean(`${handler[1]}: ${handler[2]}`) : null,
    })
  }

  const semanticPatterns = [
    ['tab', /role=["']tab["']/g],
    ['dialog', /role=["']dialog["']|aria-modal=/g],
    ['menu', /role=["']menu(?:item)?["']/g],
    ['click-handler', /onClick=\{/g],
    ['submit-handler', /onSubmit=\{/g],
  ]

  const semanticCounts = Object.fromEntries(
    semanticPatterns.map(([name, pattern]) => [name, [...source.matchAll(pattern)].length])
  )

  return { controls, semanticCounts }
}

function routeFromPage(file) {
  const segment = relative(file).replace(/^src\/app/, '').replace(/\/page\.tsx?$/, '')
  return segment || '/'
}

const files = sourceRoots.flatMap(directory => walk(path.join(root, directory)))
const pages = files
  .filter(file => /\/page\.tsx?$/.test(file))
  .map(file => ({ route: routeFromPage(file), file: relative(file), ...extractControls(file) }))
  .sort((a, b) => a.route.localeCompare(b.route))

const interactiveFiles = files
  .map(file => ({ file: relative(file), ...extractControls(file) }))
  .filter(entry => entry.controls.length > 0 || Object.values(entry.semanticCounts).some(Boolean))
  .sort((a, b) => a.file.localeCompare(b.file))

const inventory = {
  generatedAt: new Date().toISOString(),
  pageCount: pages.length,
  interactiveFileCount: interactiveFiles.length,
  directControlCount: interactiveFiles.reduce((sum, entry) => sum + entry.controls.length, 0),
  pages,
  interactiveFiles,
}

if (process.argv.includes('--verify')) {
  const saved = JSON.parse(readFileSync(outputPath, 'utf8'))
  const savedPages = new Set(saved.pages.map(page => page.file))
  const savedInteractive = new Set(saved.interactiveFiles.map(entry => entry.file))
  const missingPages = pages.filter(page => !savedPages.has(page.file))
  const missingInteractive = interactiveFiles.filter(entry => !savedInteractive.has(entry.file))

  if (missingPages.length || missingInteractive.length) {
    console.error('Workflow inventory is incomplete.', { missingPages, missingInteractive })
    process.exit(1)
  }

  console.log(`workflow inventory verified: ${pages.length} pages, ${interactiveFiles.length} interactive files, ${inventory.directControlCount} direct controls`)
} else {
  writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`)
  console.log(`workflow inventory written: ${pages.length} pages, ${interactiveFiles.length} interactive files, ${inventory.directControlCount} direct controls`)
}
