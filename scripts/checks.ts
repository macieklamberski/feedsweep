import * as urls from '../src/utils/urls.js'

export type Finding = {
  check: string
  file: string
  line: number
  text: string
}

export type SharedRegex = {
  name: string
  source: string
}

type LineCheck = {
  name: string
  isMatch: (line: string) => boolean
}

const moduleDirs = ['src/cites', 'src/embeds', 'src/media', 'src/transforms']

const commentLineRegex = /^\s*\/\//
const mediaFileRegex = /\\\.\((?:[a-z0-9]+\|)+[a-z0-9]+\)\$/
const regexAliasRegex = /^\s*(?:export )?const \w+ = [a-z]\w*Regex$/
const handKeptValueRegex = /\b([\w.]+) && \w+\.test\(\1\) \? \1 : undefined/
// A `\.(?:rss|atom)` alternation after anything but a host label, which `\.(?:com|net)` is.
const extensionListRegex = /(?<![a-z0-9])\\\.\((?:\?:)?(?:[a-z0-9]+\|)+[a-z0-9]+\)/i
const dottedListRegex = /'\.[a-z0-9]+'(?:, '\.[a-z0-9]+')+/i
const extensionRegex = /[a-z0-9]+/gi
const regexLiteralsRegex =
  /(?<![\w)\]])\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\[\n])+\/[dgimsuyv]*/g
const quantifierRegex = /\{\d+(?:,\d*)?\}/
// A year, month or day in a date route is route structure, not a value length.
const dateQuantifierRegex = /\\d\{[24]\}/g
const lengthCompareRegex = /\b(\w+)\??\.length\s*(?:[<>]=?|[!=]==)\s*(?:[2-9]|\d{2,}|\w+Length)\b/
// A plural, `rest` or `path` names an array of segments, whose length is a route shape.
const arrayNameRegex = /(?:s|rest|path)$/
const lengthMarkerRegex = /^\s*\/\/ length: (?:keeps .+ out|extracts .+)/
// Any flag but `g`: a global literal is a replace, such as a trim, and tests no value.
const anchoredLiteralRegex = /^\/\^.*\$\/[a-fh-z]*$/

const isCheckedSource = (file: string): boolean => {
  return !file.endsWith('.test.ts') && !file.startsWith('src/utils/')
}

const isCommentLine = (line: string): boolean => {
  return commentLineRegex.test(line)
}

const stripTrailingComment = (line: string): string => {
  return line.split(' // ')[0]
}

const listRegexLiterals = (line: string): Array<string> => {
  return [...line.matchAll(regexLiteralsRegex)].map((match) => match[0])
}

const readLiteralBody = (literal: string): string => {
  return literal.slice(1, literal.lastIndexOf('/'))
}

// A media file kind names an asset the platform renders, such as a cast's .svg poster, and the
// shared file regexes cover it. A format tail such as .rss or .json is what the check is for.
const isMediaExtensionList = (list: string): boolean => {
  const extensions = list.replace('?:', '').match(extensionRegex) ?? []
  const fileRegexes = [urls.imageFileRegex, urls.videoFileRegex, urls.audioFileRegex]

  return extensions.every((extension) => {
    return fileRegexes.some((regex) => regex.test(`file.${extension}`))
  })
}

// Each check is one rule from the resolver and transform conventions that a single line shows.
const lineChecks: Array<LineCheck> = [
  {
    name: 'regex-alias',
    isMatch: (line) => regexAliasRegex.test(line),
  },
  {
    name: 'hand-kept-value',
    isMatch: (line) => handKeptValueRegex.test(line),
  },
  {
    name: 'extension-list',
    isMatch: (line) => {
      const list = extensionListRegex.exec(line)?.[0] ?? dottedListRegex.exec(line)?.[0]

      if (!list || mediaFileRegex.test(line)) {
        return false
      }

      return !isMediaExtensionList(list)
    },
  },
]

export const checkLines = (file: string, source: string): Array<Finding> => {
  if (!isCheckedSource(file)) {
    return []
  }

  const findings: Array<Finding> = []

  for (const [index, line] of source.split('\n').entries()) {
    if (isCommentLine(line)) {
      continue
    }

    const code = stripTrailingComment(line)

    for (const check of lineChecks) {
      if (check.isMatch(code)) {
        findings.push({ check: check.name, file, line: index + 1, text: line.trim() })
      }
    }
  }

  return findings
}

const isLengthTest = (line: string): boolean => {
  const compared = lengthCompareRegex.exec(line)

  if (compared && !arrayNameRegex.test(compared[1])) {
    return true
  }

  return listRegexLiterals(line).some((literal) => {
    return quantifierRegex.test(literal.replace(dateQuantifierRegex, ''))
  })
}

// An allowed length names what it keeps out in a `// length: keeps {what} out` comment in the
// block above it, and every other length on a value is a guard that drops valid ids.
export const checkLengths = (file: string, source: string): Array<Finding> => {
  if (!isCheckedSource(file)) {
    return []
  }

  const findings: Array<Finding> = []
  let hasMarker = false

  for (const [index, line] of source.split('\n').entries()) {
    if (isCommentLine(line)) {
      if (lengthMarkerRegex.test(line)) {
        hasMarker = true
      }

      continue
    }

    if (!hasMarker && isLengthTest(stripTrailingComment(line))) {
      findings.push({ check: 'length-marker', file, line: index + 1, text: line.trim() })
    }

    hasMarker = false
  }

  return findings
}

// A literal spelling a shared regex is a copy, which drifts from the original.
export const checkSharedCopies = (
  file: string,
  source: string,
  shared: Array<SharedRegex>,
): Array<Finding> => {
  if (!isCheckedSource(file)) {
    return []
  }

  const findings: Array<Finding> = []

  for (const [index, line] of source.split('\n').entries()) {
    if (isCommentLine(line)) {
      continue
    }

    for (const literal of listRegexLiterals(stripTrailingComment(line))) {
      const body = readLiteralBody(literal)
      const original = shared.find((regex) => regex.source === body)

      if (original) {
        const text = `${line.trim()} copies ${original.name}`
        findings.push({ check: 'shared-copy', file, line: index + 1, text })
      }
    }
  }

  return findings
}

// An anchored value pattern written in two modules belongs in the shared utils. A copy of a shared
// regex is reported once, as a shared copy.
export const checkDuplicatePatterns = (
  sources: Record<string, string>,
  shared: Array<SharedRegex>,
): Array<Finding> => {
  const seen: Record<string, Array<Finding>> = {}

  for (const [file, source] of Object.entries(sources)) {
    if (!isCheckedSource(file)) {
      continue
    }

    let hasMarker = false

    for (const [index, line] of source.split('\n').entries()) {
      if (isCommentLine(line)) {
        if (lengthMarkerRegex.test(line)) {
          hasMarker = true
        }

        continue
      }

      // A marked length tells this platform's value from another, which a shared class cannot.
      const literals = hasMarker ? [] : listRegexLiterals(stripTrailingComment(line))
      hasMarker = false

      for (const literal of literals) {
        const body = readLiteralBody(literal)
        const isShared = shared.some((regex) => regex.source === body)

        if (!anchoredLiteralRegex.test(literal) || literal.includes('\\/') || isShared) {
          continue
        }

        const finding = { check: 'duplicate-pattern', file, line: index + 1, text: literal }
        seen[literal] = [...(seen[literal] ?? []), finding]
      }
    }
  }

  const repeated = Object.values(seen).filter((findings) => {
    return new Set(findings.map((finding) => finding.file)).size > 1
  })

  return repeated.flat()
}

export const checkSources = (
  sources: Record<string, string>,
  shared: Array<SharedRegex>,
): Array<Finding> => {
  const duplicates = checkDuplicatePatterns(sources, shared)

  return Object.entries(sources).flatMap(([file, source]) => {
    return [
      ...checkLines(file, source),
      ...checkLengths(file, source),
      ...checkSharedCopies(file, source, shared),
      ...duplicates.filter((finding) => finding.file === file),
    ]
  })
}

if (import.meta.main) {
  const sources: Record<string, string> = {}

  for (const dir of moduleDirs) {
    for await (const path of new Bun.Glob('**/*.ts').scan(dir)) {
      sources[`${dir}/${path}`] = await Bun.file(`${dir}/${path}`).text()
    }
  }

  const shared = Object.entries(urls)
    .filter((entry): entry is [string, RegExp] => entry[1] instanceof RegExp)
    .map(([name, regex]) => ({ name, source: regex.source }))
  const findings = checkSources(sources, shared)

  for (const finding of findings) {
    console.log(`${finding.check}\t${finding.file}:${finding.line}\t${finding.text}`)
  }

  console.error(`${findings.length} findings in ${Object.keys(sources).length} files`)
  process.exit(findings.length ? 1 : 0)
}
