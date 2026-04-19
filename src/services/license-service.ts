import {type ILicenseService} from './interfaces';

type CommentKind = 'c-style' | 'hash' | 'markup' | 'default';

const C_STYLE_LANGUAGES: ReadonlySet<string> = new Set([
  'javascript',
  'typescript',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'swift',
  'kotlin',
  'scala',
  'php',
]);
const HASH_LANGUAGES: ReadonlySet<string> = new Set([
  'python',
  'ruby',
  'shell',
]);
const MARKUP_LANGUAGES: ReadonlySet<string> = new Set(['html', 'xml']);

interface Markers {
  line?: string;
  blockStart?: string;
  blockEnd?: string;
}

const MARKERS: Readonly<Record<CommentKind, Markers>> = {
  'c-style': {line: '//', blockStart: '/*', blockEnd: '*/'},
  hash: {line: '#', blockStart: '"""', blockEnd: '"""'},
  markup: {blockStart: '<!--', blockEnd: '-->'},
  default: {line: '//', blockStart: '/*', blockEnd: '*/'},
};

/**
 * Formatter for a single block-comment line. Each comment kind implements
 * the four cap variants (start-only, end-only, both, neither) via a table.
 */
interface BlockVariants {
  both: (line: string) => string;
  start: (line: string) => string;
  end: (line: string) => string;
  middle: (line: string) => string;
}

const BLOCK_VARIANTS: Readonly<Record<string, BlockVariants>> = {
  'c-style': {
    both: line => `/* ${line} */`,
    start: line => `/* ${line}`,
    end: line => ` * ${line}\n */`,
    middle: line => ` * ${line}`,
  },
  python: {
    both: line => `""" ${line} """`,
    start: line => `""" ${line}`,
    end: line => `${line} """`,
    middle: line => line,
  },
  markup: {
    both: line => `<!-- ${line} -->`,
    start: line => `<!-- ${line}`,
    end: line => `${line} -->`,
    middle: line => line,
  },
};

export class LicenseService implements ILicenseService {
  constructor(
    private readonly language: string,
    private readonly currentTemplate: string,
  ) {}

  formatBlockLicense(): string {
    const lines = this.currentTemplate.split('\n');
    if (lines.length === 0) return '';
    if (lines.length === 1) return this.blockPrepend(lines[0], 'both');

    return [
      this.blockPrepend(lines[0], 'start'),
      lines
        .slice(1, -1)
        .map(line => this.blockPrepend(line, 'middle'))
        .join('\n'),
      this.blockPrepend(lines[lines.length - 1], 'end'),
    ].join('\n');
  }

  formatLineLicense(): string {
    return this.currentTemplate
      .split('\n')
      .map(line => this.linePrepend(line))
      .join('\n');
  }

  extractLicenseFromContent(content: string): string {
    const trimmedContent = content.trim();
    let pointer = 0;

    while (pointer < trimmedContent.length) {
      const commentStart = this.findCommentStart(trimmedContent, pointer);
      if (commentStart === -1) break;

      const commentEnd = this.findCommentEnd(trimmedContent, commentStart);
      if (commentEnd === -1 || commentEnd <= commentStart) {
        // Safety break: without forward progress the loop would spin forever.
        break;
      }

      const slice = trimmedContent.substring(commentStart, commentEnd);
      if (isLicenseContent(slice)) {
        return cleanLicenseContent(slice);
      }
      pointer = commentEnd;
    }
    return '';
  }

  private get commentKind(): CommentKind {
    if (C_STYLE_LANGUAGES.has(this.language)) return 'c-style';
    if (HASH_LANGUAGES.has(this.language)) return 'hash';
    if (MARKUP_LANGUAGES.has(this.language)) return 'markup';
    return 'default';
  }

  private findCommentStart(content: string, startIndex: number): number {
    const remaining = content.substring(startIndex);
    const {line, blockStart} = MARKERS[this.commentKind];

    const candidates = [line, blockStart]
      .filter((m): m is string => m !== undefined)
      .map(m => remaining.indexOf(m))
      .filter(idx => idx !== -1);
    return candidates.length === 0 ? -1 : startIndex + Math.min(...candidates);
  }

  private findCommentEnd(content: string, startIndex: number): number {
    const remaining = content.substring(startIndex);
    const {line, blockStart, blockEnd} = MARKERS[this.commentKind];

    if (blockStart && blockEnd && remaining.startsWith(blockStart)) {
      const end = remaining.indexOf(blockEnd, blockStart.length);
      return end === -1 ? content.length : startIndex + end + blockEnd.length;
    }
    if (line && remaining.startsWith(line)) {
      const newline = remaining.indexOf('\n');
      return newline === -1 ? content.length : startIndex + newline;
    }
    return -1;
  }

  private linePrepend(line: string): string {
    const trimmed = line.trim();
    switch (this.commentKind) {
      case 'hash':
        return `# ${trimmed}`;
      case 'markup':
        return `<!-- ${trimmed} -->`;
      default:
        return `// ${trimmed}`;
    }
  }

  private blockPrepend(line: string, variant: keyof BlockVariants): string {
    const trimmed = line.trim();
    const kind = this.commentKind;
    const variants =
      kind === 'markup'
        ? BLOCK_VARIANTS.markup
        : this.language === 'python'
          ? BLOCK_VARIANTS.python
          : BLOCK_VARIANTS['c-style'];
    return variants[variant](trimmed);
  }
}

const LICENSE_PHRASES: readonly string[] = [
  'copyright',
  'license',
  'licensed',
  'licensing',
  'mit license',
  'apache license',
  'gpl',
  'bsd license',
  'all rights reserved',
  'permission is hereby granted',
  'the above copyright notice',
  'this software is provided',
  'without warranty',
  'limitation of liability',
];

function isLicenseContent(content: string): boolean {
  const lower = content.toLowerCase();
  return LICENSE_PHRASES.some(phrase => lower.includes(phrase));
}

const CLEAN_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\s*\/\/\s*/gm, ''],
  [/^\s*\/\*\s*/gm, ''],
  [/\s*\*\/\s*$/gm, ''],
  [/^\s*#\s*/gm, ''],
  [/^\s*<!--\s*/gm, ''],
  [/\s*-->\s*$/gm, ''],
  [/^\s*"""\s*/gm, ''],
  [/\s*"""\s*$/gm, ''],
  [/^\s*\*\s*/gm, ''],
];

function cleanLicenseContent(content: string): string {
  return CLEAN_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    content,
  ).trim();
}
