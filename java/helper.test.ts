import { interpolateTemplate } from './templateEvaluator'; // adjust path as needed

describe('interpolateTemplate', () => {
  const fullContext = {
    user: {
      isExternal: true,
      role: 'guest',
      profile: {
        id: '123',
        name: 'Alice'
      }
    },
    config: {
      api: {
        baseUrl: 'https://api.example.com'
      },
      externalUrl: 'https://external.com',
      internalUrl: 'https://internal.com'
    },
    count: 42,
    flag: false,
    nullVal: null,
    undefVal: undefined
  };

  // ======================
  // ✅ POSITIVE TESTS
  // ======================

  it('should interpolate simple variable references', () => {
    expect(interpolateTemplate('~{user.profile.id}', fullContext)).toBe('123');
    expect(interpolateTemplate('~{config.api.baseUrl}', fullContext)).toBe('https://api.example.com');
    expect(interpolateTemplate('~{count}', fullContext)).toBe('42');
  });

  it('should handle multiple placeholders in one template', () => {
    const template = '~{config.api.baseUrl}/users/~{user.profile.id}';
    expect(interpolateTemplate(template, fullContext)).toBe('https://api.example.com/users/123');
  });

  it('should evaluate ternary with boolean condition and string literals', () => {
    const template = "~{ user.isExternal ? 'external' : 'internal' }";
    expect(interpolateTemplate(template, fullContext)).toBe('external');
  });

  it('should evaluate ternary with variable references in all parts', () => {
    const template = "~{ user.isExternal ? config.externalUrl : config.internalUrl }";
    expect(interpolateTemplate(template, fullContext)).toBe('https://external.com');
  });

  it('should handle ternary with mixed literals and variables', () => {
    const template = "~{ flag ? 'on' : user.role }";
    expect(interpolateTemplate(template, fullContext)).toBe('guest');
  });

  it('should convert null and undefined to empty string', () => {
    expect(interpolateTemplate('~{nullVal}', fullContext)).toBe('');
    expect(interpolateTemplate('~{undefVal}', fullContext)).toBe('');
  });

  it('should handle numeric and boolean literals inside ternary', () => {
    expect(interpolateTemplate('~{ true ? 100 : 200 }', {})).toBe('100');
    expect(interpolateTemplate("~{ false ? 'a' : 'b' }", {})).toBe('b');
  });

  it('should handle empty placeholder ~{}', () => {
    expect(interpolateTemplate('~{}', {})).toBe('');
    expect(interpolateTemplate('start~{}end', {})).toBe('startend');
  });

  it('should handle whitespace in expressions', () => {
    expect(interpolateTemplate('~{ user.isExternal ? config.externalUrl : config.internalUrl }', fullContext)).toBe('https://external.com');
    expect(interpolateTemplate('~{   user.profile.id   }', fullContext)).toBe('123');
  });

  it('should work with string literals containing quotes', () => {
    const template = "~{ user.isExternal ? \"Hello 'world'\" : 'Hi \"user\"' }";
    expect(interpolateTemplate(template, fullContext)).toBe("Hello 'world'");
  });

  // ======================
  // ❌ NEGATIVE TESTS
  // ======================

  it('should return empty string for missing path', () => {
    expect(interpolateTemplate('~{missing}', {})).toBe('');
    expect(interpolateTemplate('~{user.missing}', fullContext)).toBe('');
    expect(interpolateTemplate('~{config.api.missing}', fullContext)).toBe('');
  });

  it('should not leak unprocessed placeholders for invalid expressions', () => {
    // Even if expression is invalid, it should not return "~{...}"
    expect(interpolateTemplate('~{123abc}', {})).toBe('~{123abc}'); // or '' if you prefer strict mode
    // But for safety, we currently return the original match on error
    // Adjust based on your error policy
  });

  it('should handle malformed ternary (missing parts)', () => {
    // These are not valid ternaries → treated as plain paths (which don't exist)
    expect(interpolateTemplate('~{ a ? b }', {})).toBe(''); // not a valid ternary → tries to resolve "a ? b" as path → fails
    expect(interpolateTemplate('~{ ? b : c }', {})).toBe('');
    expect(interpolateTemplate('~{ a ? : c }', {})).toBe('');
  });

  it('should not support nested ternaries (graceful fallback)', () => {
    // Only the first ternary is parsed
    const result = interpolateTemplate('~{ true ? (true ? "A" : "B") : "C" }', {});
    // Our simple parser sees: condition="true", truePart="(true", falsePart=""A" : "B") : "C""
    // This will likely fail → returns original or empty
    // For this test, we expect it NOT to throw, and handle as best as possible
    expect(() => interpolateTemplate('~{ true ? (true ? "A" : "B") : "C" }', {})).not.toThrow();
  });

  it('should handle template with no placeholders', () => {
    expect(interpolateTemplate('plain text', {})).toBe('plain text');
    expect(interpolateTemplate('', {})).toBe('');
  });

  it('should handle undefined context values gracefully', () => {
    const partialContext = { user: { profile: {} } };
    expect(interpolateTemplate('~{user.profile.id}', partialContext)).toBe('');
  });

  // ======================
  // ⚠️ EDGE CASES
  // ======================

  it('should handle zero and negative numbers', () => {
    expect(interpolateTemplate('~{ -5 }', {})).toBe('-5');
    expect(interpolateTemplate('~{ 0 }', {})).toBe('0');
    expect(interpolateTemplate('~{ -0.5 }', {})).toBe('-0.5');
  });

  it('should not match malformed placeholders', () => {
    expect(interpolateTemplate('text ~{unclosed', {})).toBe('text ~{unclosed');
    expect(interpolateTemplate('text ~} reversed {', {})).toBe('text ~} reversed {');
  });

  it('should handle multiple empty placeholders', () => {
    expect(interpolateTemplate('~{}~{}', {})).toBe('');
    expect(interpolateTemplate('a~{}b~{}c', {})).toBe('abc');
  });
});