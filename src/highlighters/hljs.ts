import type { LanguageFn } from 'highlight.js'
import core from 'highlight.js/lib/core'
import applescript from 'highlight.js/lib/languages/applescript'
import arduino from 'highlight.js/lib/languages/arduino'
import awk from 'highlight.js/lib/languages/awk'
import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import clojure from 'highlight.js/lib/languages/clojure'
import cmake from 'highlight.js/lib/languages/cmake'
import cpp from 'highlight.js/lib/languages/cpp'
import crystal from 'highlight.js/lib/languages/crystal'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import dart from 'highlight.js/lib/languages/dart'
import delphi from 'highlight.js/lib/languages/delphi'
import diff from 'highlight.js/lib/languages/diff'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import elixir from 'highlight.js/lib/languages/elixir'
import elm from 'highlight.js/lib/languages/elm'
import erb from 'highlight.js/lib/languages/erb'
import erlang from 'highlight.js/lib/languages/erlang'
import fsharp from 'highlight.js/lib/languages/fsharp'
import gherkin from 'highlight.js/lib/languages/gherkin'
import glsl from 'highlight.js/lib/languages/glsl'
import go from 'highlight.js/lib/languages/go'
import graphql from 'highlight.js/lib/languages/graphql'
import groovy from 'highlight.js/lib/languages/groovy'
import haskell from 'highlight.js/lib/languages/haskell'
import haxe from 'highlight.js/lib/languages/haxe'
import http from 'highlight.js/lib/languages/http'
import ini from 'highlight.js/lib/languages/ini'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import julia from 'highlight.js/lib/languages/julia'
import kotlin from 'highlight.js/lib/languages/kotlin'
import latex from 'highlight.js/lib/languages/latex'
import less from 'highlight.js/lib/languages/less'
import lisp from 'highlight.js/lib/languages/lisp'
import lua from 'highlight.js/lib/languages/lua'
import makefile from 'highlight.js/lib/languages/makefile'
import markdown from 'highlight.js/lib/languages/markdown'
import matlab from 'highlight.js/lib/languages/matlab'
import nginx from 'highlight.js/lib/languages/nginx'
import nix from 'highlight.js/lib/languages/nix'
import objectivec from 'highlight.js/lib/languages/objectivec'
import ocaml from 'highlight.js/lib/languages/ocaml'
import perl from 'highlight.js/lib/languages/perl'
import pgsql from 'highlight.js/lib/languages/pgsql'
import php from 'highlight.js/lib/languages/php'
import phpTemplate from 'highlight.js/lib/languages/php-template'
import plaintext from 'highlight.js/lib/languages/plaintext'
import powershell from 'highlight.js/lib/languages/powershell'
import prolog from 'highlight.js/lib/languages/prolog'
import puppet from 'highlight.js/lib/languages/puppet'
import python from 'highlight.js/lib/languages/python'
import pythonRepl from 'highlight.js/lib/languages/python-repl'
import r from 'highlight.js/lib/languages/r'
import ruby from 'highlight.js/lib/languages/ruby'
import rust from 'highlight.js/lib/languages/rust'
import scala from 'highlight.js/lib/languages/scala'
import scheme from 'highlight.js/lib/languages/scheme'
import scss from 'highlight.js/lib/languages/scss'
import shell from 'highlight.js/lib/languages/shell'
import sql from 'highlight.js/lib/languages/sql'
import stata from 'highlight.js/lib/languages/stata'
import swift from 'highlight.js/lib/languages/swift'
import twig from 'highlight.js/lib/languages/twig'
import typescript from 'highlight.js/lib/languages/typescript'
import vbnet from 'highlight.js/lib/languages/vbnet'
import verilog from 'highlight.js/lib/languages/verilog'
import vim from 'highlight.js/lib/languages/vim'
import wasm from 'highlight.js/lib/languages/wasm'
import x86asm from 'highlight.js/lib/languages/x86asm'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import type { HighlightFn } from '../types.js'

// A private instance: the shared highlight.js/lib/common one also holds a consumer's registrations.
const hljs = core.newInstance()

// The grammars of highlight.js's common build, in its registration order.
const commonLanguages: Record<string, LanguageFn> = {
  xml,
  bash,
  c,
  cpp,
  csharp,
  css,
  markdown,
  diff,
  ruby,
  go,
  graphql,
  ini,
  java,
  javascript,
  json,
  kotlin,
  less,
  lua,
  makefile,
  perl,
  objectivec,
  php,
  'php-template': phpTemplate,
  plaintext,
  python,
  'python-repl': pythonRepl,
  r,
  rust,
  scss,
  shell,
  sql,
  swift,
  yaml,
  typescript,
  vbnet,
  wasm,
}

for (const [name, grammar] of Object.entries(commonLanguages)) {
  hljs.registerLanguage(name, grammar)
}

// Grammars outside highlight.js's common build that feed code blocks declare.
export const extraLanguages: Record<string, LanguageFn> = {
  applescript,
  arduino,
  awk,
  clojure,
  cmake,
  crystal,
  dart,
  delphi,
  dockerfile,
  elixir,
  elm,
  erb,
  erlang,
  fsharp,
  gherkin,
  glsl,
  groovy,
  haskell,
  haxe,
  http,
  julia,
  latex,
  lisp,
  matlab,
  nginx,
  nix,
  ocaml,
  pgsql,
  powershell,
  prolog,
  puppet,
  scala,
  scheme,
  stata,
  twig,
  verilog,
  vim,
  x86asm,
}

for (const [name, grammar] of Object.entries(extraLanguages)) {
  hljs.registerLanguage(name, grammar)
}

// Hint tokens highlight.js does not resolve on its own, mapped to a registered grammar.
// Some map a dialect to its nearest grammar: fish to bash, racket to scheme, elisp to lisp.
// A registered grammar ships its own aliases: hs, clj, console, objc, golang, cs, jsx, yml, sh.
export const languageAliases: Record<string, Array<string>> = {
  bash: ['fish', 'tcsh', 'csh'],
  c: ['clike'],
  csharp: ['c-sharp'],
  json: ['jsonc', 'json5', 'jsonl'],
  lisp: ['emacs-lisp', 'elisp', 'cl', 'common-lisp', 'common_lisp', 'commonlisp'],
  objectivec: ['objective-c'],
  pgsql: ['psql'],
  python: ['python3', 'py3'],
  scheme: ['racket'],
  shell: ['shell-session', 'shell-script', 'shellscript', 'terminal'],
  sql: ['mysql', 'tsql', 'plsql'],
  vbnet: ['vb', 'visualbasic'],
  x86asm: ['asm', 'nasm', 'assembly'],
  xml: ['markup'],
}

for (const [languageName, aliases] of Object.entries(languageAliases)) {
  hljs.registerAliases(aliases, { languageName })
}

// Highlights with highlight.js, or returns nothing for a language it does not know.
export const hljsHighlightFn: HighlightFn = (text, language) => {
  if (!hljs.getLanguage(language)) {
    return
  }

  return hljs.highlight(text, { language }).value
}
