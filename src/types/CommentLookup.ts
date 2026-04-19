import {type CommentStyle} from './CommentStyle';

/**
 * Language-ID → comment style lookup.
 *
 * Every comment-style object is declared once as a module-level constant
 * so multiple languages that share a style share the same object reference,
 * and so the list of c-style languages can be enumerated by `Object.keys`
 * rather than copy-pasted.
 */
const LINE_HASH: CommentStyle = {type: 'line', prefix: '# '};
const BLOCK_SLASH: CommentStyle = {type: 'block', start: '/*', end: ' */'};
const BLOCK_MARKUP: CommentStyle = {type: 'block', start: '<!--', end: ' -->'};

const C_STYLE_LANGUAGES = [
  'javascript',
  'typescript',
  'typescriptreact',
  'javascriptreact',
  'jsx',
  'tsx',
  'cpp',
  'c',
  'java',
  'csharp',
  'php',
  'go',
  'rust',
  'swift',
  'kotlin',
  'scala',
  'dart',
  'css',
  'scss',
] as const;

export const CommentLookup: Readonly<Record<string, CommentStyle>> = {
  python: LINE_HASH,
  html: BLOCK_MARKUP,
  ...Object.fromEntries(C_STYLE_LANGUAGES.map(lang => [lang, BLOCK_SLASH])),
};
