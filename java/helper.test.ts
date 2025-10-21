// interpolateTemplate.test.ts
import { describe, it, expect, vi } from 'vitest';
import { interpolateTemplate, getNestedValue } from './interpolateTemplate';

// Mock console.warn to avoid polluting test output and to assert warnings
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('getNestedValue', () => {
  const testObj = {
    a: {
      b: {
        c: 'deep-value',
        arr: [1, 2, { x: 'nested-in-array' }],
      },
      bool: true,
    },
    nullProp: null,
    undefProp: undefined,
  };

  it('should return nested value for valid path', () => {
    expect(getNestedValue(testObj, 'a.b.c')).toBe('deep-value');
    expect(getNestedValue(testObj, 'a.bool')).toBe(true);
  });

  it('should return undefined for non-existent path', () => {
    expect(getNestedValue(testObj, 'a.b.d')).toBeUndefined();
    expect(getNestedValue(testObj, 'x.y.z')).toBeUndefined();
  });

  it('should return undefined when intermediate property is null', () => {
    expect(getNestedValue(testObj, 'nullProp.someKey')).toBeUndefined();
  });

  it('should return undefined when intermediate property is undefined', () => {
    expect(getNestedValue(testObj, 'undefProp.someKey')).toBeUndefined();
  });

  it('should return undefined when root object is null or undefined', () => {
    expect(getNestedValue(null, 'a.b')).toBeUndefined();
    expect(getNestedValue(undefined, 'a.b')).toBeUndefined();
  });

  it('should return undefined when hitting non-object in path', () => {
    expect(getNestedValue(testObj, 'a.b.c.d')).toBeUndefined(); // 'deep-value' is string, not object
  });
});

describe('interpolateTemplate', () => {
  afterEach(() => {
    mockConsoleWarn.mockClear();
  });

  // ✅ Positive Scenarios
  describe('Positive cases', () => {
    it('should return original string when no ~{...} is present', () => {
      expect(interpolateTemplate('plain/text', {})).toBe('plain/text');
      expect(interpolateTemplate('user/name/123', {})).toBe('user/name/123');
    });

    it('should interpolate simple variables', () => {
      expect(interpolateTemplate('~{name}', { name: 'Alice' })).toBe('Alice');
      expect(interpolateTemplate('Hello ~{user.name}!', { user: { name: 'Bob' } })).toBe('Hello Bob!');
    });

    it('should handle string literals', () => {
      expect(interpolateTemplate('~{"hello"}', {})).toBe('hello');
      expect(interpolateTemplate("~{'world'}", {})).toBe('world');
    });

    it('should handle boolean and null literals', () => {
      expect(interpolateTemplate('~{true}', {})).toBe('true');
      expect(interpolateTemplate('~{false}', {})).toBe('false');
      expect(interpolateTemplate('~{null}', {})).toBe('');
      expect(interpolateTemplate('~{undefined}', {})).toBe('');
    });

    it('should handle number literals', () => {
      expect(interpolateTemplate('~{42}', {})).toBe('42');
      expect(interpolateTemplate('~{-3.14}', {})).toBe('-3.14');
    });

    it('should evaluate ternary expressions (truthy)', () => {
      expect(interpolateTemplate('~{isAdmin ? "admin" : "user"}', { isAdmin: true })).toBe('admin');
    });

    it('should evaluate ternary expressions (falsy)', () => {
      expect(interpolateTemplate('~{isAdmin ? "admin" : "user"}', { isAdmin: false })).toBe('user');
      expect(interpolateTemplate('~{missing ? "yes" : "no"}', {})).toBe('no');
    });

    it('should handle nested interpolation in ternary branches', () => {
      const ctx = { flag: true, a: 'A', b: 'B' };
      expect(interpolateTemplate('~{flag ? ~{a} : ~{b}}', ctx)).toBe('A');
    });

    it('should return empty string for ~{}', () => {
      expect(interpolateTemplate('~{}', {})).toBe('');
    });

    it('should handle falsy but defined values (e.g., 0, false, "")', () => {
      expect(interpolateTemplate('~{count}', { count: 0 })).toBe('0');
      expect(interpolateTemplate('~{flag}', { flag: false })).toBe('false');
      expect(interpolateTemplate('~{empty}', { empty: '' })).toBe('');
    });
  });

  // ❌ Negative Scenarios
  describe('Negative/error cases', () => {
    it('should leave malformed expressions unchanged and warn', () => {
      const result = interpolateTemplate('~{invalid!}', {});
      expect(result).toBe('~{invalid!}');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to evaluate template expression: "invalid!"',
        expect.any(Error)
      );
    });

    it('should handle invalid variable names (starting with number)', () => {
      const result = interpolateTemplate('~{123abc}', {});
      expect(result).toBe('~{123abc}');
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should fallback to original on malformed ternary (missing ? or :)', () => {
      expect(interpolateTemplate('~{a ? b}', {})).toBe('~{a ? b}');
      expect(interpolateTemplate('~{a : b}', {})).toBe('~{a : b}');
      expect(mockConsoleWarn).toHaveBeenCalledTimes(2);
    });

    it('should fallback on ternary with empty parts', () => {
      expect(interpolateTemplate('~{ ? "a" : "b" }', {})).toBe('~{ ? "a" : "b" }');
      expect(interpolateTemplate('~{flag ?  : "b"}', { flag: true })).toBe('~{flag ?  : "b"}');
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should not crash on deeply broken expressions', () => {
      expect(interpolateTemplate('~{a.b.c.d.e}', { a: null })).toBe('');
    });

    it('should preserve original match when evaluation throws', () => {
      const result = interpolateTemplate('~{[notvalid]}', {});
      expect(result).toBe('~{[notvalid]}');
    });
  });

  // ⚠️ Edge Cases
  describe('Edge cases', () => {
    it('should handle whitespace in expressions', () => {
      expect(interpolateTemplate('~{ user.name }', { user: { name: 'Alice' } })).toBe('Alice');
      expect(interpolateTemplate('~{ flag ? "yes" : "no" }', { flag: true })).toBe('yes');
    });

    it('should handle multiple interpolations', () => {
      const ctx = { a: 'X', b: 'Y' };
      expect(interpolateTemplate('~{a}/~{b}', ctx)).toBe('X/Y');
    });

    it('should handle null/undefined values as empty string', () => {
      expect(interpolateTemplate('~{missing}', {})).toBe('');
      expect(interpolateTemplate('~{nullVal}', { nullVal: null })).toBe('');
      expect(interpolateTemplate('~{undefVal}', { undefVal: undefined })).toBe('');
    });
  });
});