type Context = Record<string, unknown>;

/**
 * Interpolates a template string like "~{a}/~{b ? c : d}"
 */
function interpolateTemplate(template: string, context: Context): string {
  return template.replace(/~\{([^}]*)\}/g, (match, expr) => {
    const trimmed = expr.trim();
    if (trimmed === '') {
      return ''; // ~{} → ""
    }
    try {
      const value = evaluateExpression(trimmed, context);
      return value == null ? '' : String(value);
    } catch (error) {
      console.warn(`Failed to evaluate expression: "${trimmed}"`, error);
      return match; // or return '' for silent fail
    }
  });
}

/**
 * Evaluates a single expression: ternary, value, or variable
 */
function evaluateExpression(expr: string, context: Context): unknown {
  // Count ? and : — must have exactly one of each, and ? must come before :
  const qIndex = expr.indexOf('?');
  const cIndex = expr.lastIndexOf(':'); // use lastIndexOf to allow nested-like (though we don't support nesting)

  if (qIndex !== -1 && cIndex !== -1 && qIndex < cIndex) {
    // Split manually to avoid regex greediness issues
    const conditionPart = expr.substring(0, qIndex).trim();
    const remainder = expr.substring(qIndex + 1).trim();
    const colonIndex = remainder.indexOf(':');
    
    if (colonIndex === -1) {
      // Malformed: has ? but no : in remainder → not a valid ternary
      return evaluateValue(expr, context);
    }

    const truePart = remainder.substring(0, colonIndex).trim();
    const falsePart = remainder.substring(colonIndex + 1).trim();

    // If any part is empty, treat as invalid ternary → fallback to value
    if (conditionPart === '' || truePart === '' || falsePart === '') {
      return evaluateValue(expr, context);
    }

    const condition = evaluateExpression(conditionPart, context);
    return condition
      ? evaluateExpression(truePart, context)
      : evaluateExpression(falsePart, context);
  }

  // Not a ternary → evaluate as value
  return evaluateValue(expr, context);
}

/**
 * Evaluates a simple value: string literal, boolean, number, or dot-path variable
 */
function evaluateValue(val: string, context: Context): unknown {
  // String literal: 'hello' or "hello"
  if (
    (val.startsWith("'") && val.endsWith("'")) ||
    (val.startsWith('"') && val.endsWith('"'))
  ) {
    return val.slice(1, -1);
  }

  // Boolean & null literals
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (val === 'undefined') return undefined;

  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(val)) {
    return Number(val);
  }

  // Dot notation variable reference: user.name, config.api.url
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(val)) {
    return val.split('.').reduce<unknown>((obj, key) => {
      if (obj == null || typeof obj !== 'object') return undefined;
      return (obj as Record<string, unknown>)[key];
    }, context);
  }

  throw new Error(`Unsupported expression: "${val}"`);
}