type Context = Record<string, unknown>;

export function getNestedValue(obj: unknown, path: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }

  return path.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, obj);
}

const STRING_LITERAL_REGEX = /^(['"])(.*)\1$/;
const NUMBER_LITERAL_REGEX = /^-?\d+(\.\d+)?$/;
const IDENTIFIER_PATH_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;

function evaluateValue(value: string, context: Context): unknown {
  // String literal: "abc" or 'abc'
  const stringMatch = STRING_LITERAL_REGEX.exec(value);
  if (stringMatch) {
    return stringMatch[2];
  }

  // Boolean & null literals
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;

  // Number literal
  if (NUMBER_LITERAL_REGEX.test(value)) {
    return Number(value);
  }

  // Dot-separated variable path (e.g., user.profile.name)
  if (IDENTIFIER_PATH_REGEX.test(value)) {
    return getNestedValue(context, value);
  }

  throw new Error(`Invalid or unsupported expression: "${value}"`);
}

function evaluateExpression(expr: string, context: Context): unknown {
  const questionIndex = expr.indexOf('?');
  const colonIndex = expr.lastIndexOf(':');

  // Attempt to parse as ternary: condition ? truthy : falsy
  if (
    questionIndex !== -1 &&
    colonIndex !== -1 &&
    questionIndex < colonIndex &&
    questionIndex > 0 && // condition must exist
    colonIndex < expr.length - 1 // falsy part must exist
  ) {
    const conditionStr = expr.substring(0, questionIndex).trim();
    const afterQuestion = expr.substring(questionIndex + 1).trim();
    const innerColonIndex = afterQuestion.indexOf(':');

    if (innerColonIndex === -1) {
      // Malformed: ? without matching : in remainder
      return evaluateValue(expr, context);
    }

    const truthyStr = afterQuestion.substring(0, innerColonIndex).trim();
    const falsyStr = afterQuestion.substring(innerColonIndex + 1).trim();

    if (truthyStr === '' || falsyStr === '') {
      return evaluateValue(expr, context);
    }

    const condition = evaluateExpression(conditionStr, context);
    return condition ? evaluateExpression(truthyStr, context) : evaluateExpression(falsyStr, context);
  }

  return evaluateValue(expr, context);
}

export function interpolateTemplate(template: string, context: Context): string {
  return template.replace(/~\{([^}]*)\}/g, (match, expr) => {
    const expression = expr.trim();
    if (expression === '') {
      return '';
    }

    try {
      const result = evaluateExpression(expression, context);
      return result == null ? '' : String(result);
    } catch (error) {
      console.warn(`Failed to evaluate template expression: "${expression}"`, error);
      return match; // preserve original on error
    }
  });
}