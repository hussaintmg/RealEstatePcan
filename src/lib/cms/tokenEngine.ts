/**
 * Structured Variable Token AST Engine
 * Stores content as structured tokens [{ type: 'text', value: '...' }, { type: 'variable', key: '...' }]
 * rather than raw fragile strings.
 */

export type TokenNode =
  | { type: 'text'; value: string }
  | {
      type: 'variable';
      key: string;
      fallback?: string;
      formatter?: 'currency' | 'date' | 'number' | 'uppercase' | 'lowercase' | 'relative_time';
    };

/**
 * Parses a string containing `[variable.key]` or `{{variable.key}}` into a structured TokenNode array.
 */
export function parseStringToTokens(input: string): TokenNode[] {
  if (!input || typeof input !== 'string') return [{ type: 'text', value: '' }];

  const tokens: TokenNode[] = [];
  // Matches either {{key}} or [key] or [key|formatter|fallback]
  const regex = /(\{\{([^{}]+)\}\}|\[([^[\]]+)\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    // Leading text before the match
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: input.substring(lastIndex, match.index),
      });
    }

    const rawToken = (match[2] || match[3] || '').trim();
    const parts = rawToken.split('|').map((p) => p.trim());
    const key = parts[0];
    const formatter = parts[1] as any;
    const fallback = parts[2];

    tokens.push({
      type: 'variable',
      key,
      formatter: formatter || undefined,
      fallback: fallback || undefined,
    });

    lastIndex = regex.lastIndex;
  }

  // Trailing text after the last match
  if (lastIndex < input.length) {
    tokens.push({
      type: 'text',
      value: input.substring(lastIndex),
    });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', value: input }];
}

/**
 * Serializes a TokenNode array into a bracketed display string or JSON representation.
 */
export function serializeTokensToString(tokens: TokenNode[]): string {
  if (!Array.isArray(tokens)) return '';

  return tokens
    .map((t) => {
      if (t.type === 'text') return t.value;
      if (t.type === 'variable') {
        const parts = [t.key];
        if (t.formatter) parts.push(t.formatter);
        if (t.fallback) parts.push(t.fallback);
        return `[${parts.join('|')}]`;
      }
      return '';
    })
    .join('');
}

/**
 * Resolves a dot-delimited path on a data object.
 */
function resolveDeep(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const segments = path.split('.');
  let curr = obj;
  for (const seg of segments) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[seg];
  }
  return curr;
}

/**
 * Applies a safe registered formatter to a variable value.
 */
export function applyFormatter(val: any, formatter?: string, fallback: string = ''): string {
  if (val === undefined || val === null || val === '') {
    return fallback;
  }

  switch (formatter) {
    case 'currency': {
      const num = Number(val);
      if (isNaN(num)) return fallback || String(val);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(num);
    }
    case 'number': {
      const num = Number(val);
      if (isNaN(num)) return fallback || String(val);
      return new Intl.NumberFormat('en-US').format(num);
    }
    case 'date': {
      const d = new Date(val);
      if (isNaN(d.getTime())) return fallback || String(val);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    case 'uppercase':
      return String(val).toUpperCase();
    case 'lowercase':
      return String(val).toLowerCase();
    case 'relative_time': {
      const d = new Date(val);
      if (isNaN(d.getTime())) return fallback || String(val);
      const diffSecs = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSecs < 60) return 'just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return `${Math.floor(diffSecs / 86400)}d ago`;
    }
    default:
      return String(val);
  }
}

/**
 * Evaluates a structured TokenNode array against a runtime data context to produce final output.
 */
export function interpolateTokens(tokens: TokenNode[], context: Record<string, any> = {}): string {
  if (!Array.isArray(tokens)) return '';

  return tokens
    .map((token) => {
      if (token.type === 'text') return token.value;
      if (token.type === 'variable') {
        const rawVal = resolveDeep(context, token.key);
        return applyFormatter(rawVal, token.formatter, token.fallback || '');
      }
      return '';
    })
    .join('');
}
