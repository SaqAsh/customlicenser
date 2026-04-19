/**
 * File extensions that should never receive a license header.
 * Limited to data, config, markup, lock, and archive/binary files.
 */
export const SKIP_EXTENSIONS: ReadonlySet<string> = new Set([
  'md',
  'txt',
  'json',
  'yaml',
  'yml',
  'xml',
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'svg',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'eot',
  'pdf',
  'zip',
  'tar',
  'gz',
  'rar',
  '7z',
  'lock',
  'log',
  'tmp',
  'temp',
  'bak',
  'backup',
]);

/**
 * VSCode language IDs that should never receive a license header. Covers
 * plain text, markup/data languages, shell/config, templating engines,
 * and common binary asset formats.
 */
export const SKIP_LANGUAGES: ReadonlySet<string> = new Set([
  // plain text / markup / data
  'plaintext',
  'text',
  'plain',
  'markdown',
  'json',
  'jsonc',
  'yaml',
  'xml',
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'svg',
  'csv',
  'tsv',

  // config / lock / env
  'properties',
  'ini',
  'toml',
  'dockerfile',
  'makefile',
  'conf',
  'config',
  'env',

  // shell / batch
  'shellscript',
  'powershell',
  'bat',
  'cmd',

  // vcs / diff / log
  'git-commit',
  'git-rebase',
  'ignore',
  'diff',
  'patch',
  'log',

  // templating engines
  'coffeescript',
  'jade',
  'pug',
  'stylus',
  'vue',
  'vue-html',
  'razor',
  'blade',
  'twig',
  'handlebars',
  'mustache',
  'ejs',
  'erb',
  'haml',
  'slim',
  'liquid',
  'nunjucks',
  'jinja',
]);
