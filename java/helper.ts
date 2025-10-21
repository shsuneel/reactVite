// interpolateTemplate.ts

type Context = Record<string, unknown>;

/**
 * Safely retrieves a nested value from an object using a dot-separated path.
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  return path.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);
}

const STRING_LITERAL_REGEX = /^(['"])(.*)\1$/;
const NUMBER_LITERAL_REGEX = /^-?\d+(\.\d+)?$/;
const IDENTIFIER_PATH_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;

function evaluateValue(value: string, context: Context): unknown {
  const stringMatch = STRING_LITERAL_REGEX.exec(value);
  if (stringMatch) return stringMatch[2];

  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;

  if (NUMBER_LITERAL_REGEX.test(value)) return Number(value);

  if (IDENTIFIER_PATH_REGEX.test(value)) return getNestedValue(context, value);

  throw new Error(`Invalid or unsupported expression: "${value}"`);
}

function evaluateExpression(expr: string, context: Context): unknown {
  const questionIndex = expr.indexOf('?');
  const colonIndex = expr.lastIndexOf(':');

  if (
    questionIndex !== -1 &&
    colonIndex !== -1 &&
    questionIndex < colonIndex &&
    questionIndex > 0 &&
    colonIndex < expr.length - 1
  ) {
    const conditionStr = expr.substring(0, questionIndex).trim();
    const afterQuestion = expr.substring(questionIndex + 1).trim();
    const innerColonIndex = afterQuestion.indexOf(':');

    if (innerColonIndex === -1) return evaluateValue(expr, context);

    const truthyStr = afterQuestion.substring(0, innerColonIndex).trim();
    const falsyStr = afterQuestion.substring(innerColonIndex + 1).trim();

    if (truthyStr === '' || falsyStr === '') return evaluateValue(expr, context);

    const condition = evaluateExpression(conditionStr, context);
    return condition
      ? evaluateExpression(truthyStr, context)
      : evaluateExpression(falsyStr, context);
  }

  return evaluateValue(expr, context);
}

/**
 * Interpolates expressions in the form `~{expr}` within a template string.
 * Returns the original string if no `~{...}` patterns exist.
 * On error, logs a warning and leaves the expression unchanged.
 */
export function interpolateTemplate(template: string, context: Context): string {
  return template.replace(/~\{([^}]*)\}/g, (match, expr) => {
    const expression = expr.trim();
    if (expression === '') return '';

    try {
      const result = evaluateExpression(expression, context);
      return result == null ? '' : String(result);
    } catch (error) {
      console.warn(`Failed to evaluate template expression: "${expression}"`, error);
      return match;
    }
  });
}

// F2

// interpolate.ts

import { interpolateTemplate, Context } from './interpolateTemplate';

/**
 * Recursively interpolates `~{...}` expressions in strings within any data structure.
 *
 * Supports:
 * - Strings → interpolated via `interpolateTemplate`
 * - Plain objects → recurses into values
 * - Arrays → recurses into items
 * - Primitives (number, boolean, null, etc.) → returned as-is
 *
 * Does NOT recurse into non-plain objects (e.g., Date, RegExp, class instances).
 */
export function interpolate<T>(value: T, context: Context): T {
  // Handle strings
  if (typeof value === 'string') {
    return interpolateTemplate(value, context) as T;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => interpolate(item, context)) as T;
  }

  // Handle plain objects only (not Date, Map, etc.)
  if (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = interpolate(val, context);
    }
    return result as T;
  }

  // Return primitives and non-plain objects unchanged
  return value;
}