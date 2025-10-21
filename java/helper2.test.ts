// interpolate.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { interpolateTemplate } from './interpolateTemplate';
import { interpolate } from './interpolate';

// Mock console.warn to avoid noise and enable assertions
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => {
  mockConsoleWarn.mockClear();
});

// ─────────────────────────────────────────────
// interpolateTemplate: STRING-ONLY tests
// ─────────────────────────────────────────────

describe('interpolateTemplate (string-only)', () => {
  it('returns original string when no ~{...} is present', () => {
    expect(interpolateTemplate('plain/text', {})).toBe('plain/text');
    expect(interpolateTemplate('user/123', {})).toBe('user/123');
  });

  it('interpolates simple variables', () => {
    expect(interpolateTemplate('~{name}', { name: 'Alice' })).toBe('Alice');
    expect(interpolateTemplate('Hello ~{user.name}!', { user: { name: 'Bob' } })).toBe('Hello Bob!');
  });

  it('handles string literals', () => {
    expect(interpolateTemplate('~{"hello"}', {})).toBe('hello');
    expect(interpolateTemplate("~{'world'}", {})).toBe('world');
  });

  it('handles boolean, null, undefined literals', () => {
    expect(interpolateTemplate('~{true}', {})).toBe('true');
    expect(interpolateTemplate('~{false}', {})).toBe('false');
    expect(interpolateTemplate('~{null}', {})).toBe('');
    expect(interpolateTemplate('~{undefined}', {})).toBe('');
  });

  it('handles number literals', () => {
    expect(interpolateTemplate('~{42}', {})).toBe('42');
    expect(interpolateTemplate('~{-3.14}', {})).toBe('-3.14');
  });

  it('evaluates ternary expressions (truthy/falsy)', () => {
    expect(interpolateTemplate('~{isAdmin ? "admin" : "user"}', { isAdmin: true })).toBe('admin');
    expect(interpolateTemplate('~{isAdmin ? "admin" : "user"}', { isAdmin: false })).toBe('user');
    expect(interpolateTemplate('~{missing ? "yes" : "no"}', {})).toBe('no');
  });

  it('handles whitespace in expressions', () => {
    expect(interpolateTemplate('~{ user.name }', { user: { name: 'Alice' } })).toBe('Alice');
    expect(interpolateTemplate('~{ flag ? "yes" : "no" }', { flag: true })).toBe('yes');
  });

  it('returns empty string for ~{}', () => {
    expect(interpolateTemplate('~{}', {})).toBe('');
  });

  it('handles falsy but defined values (0, false, "")', () => {
    expect(interpolateTemplate('~{count}', { count: 0 })).toBe('0');
    expect(interpolateTemplate('~{flag}', { flag: false })).toBe('false');
    expect(interpolateTemplate('~{empty}', { empty: '' })).toBe('');
  });

  it('returns empty string for null/undefined context values', () => {
    expect(interpolateTemplate('~{missing}', {})).toBe('');
    expect(interpolateTemplate('~{nullVal}', { nullVal: null })).toBe('');
    expect(interpolateTemplate('~{undefVal}', { undefVal: undefined })).toBe('');
  });

  // ❌ Error cases
  it('leaves malformed expressions unchanged and warns', () => {
    const result = interpolateTemplate('~{invalid!}', {});
    expect(result).toBe('~{invalid!}');
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Failed to evaluate template expression: "invalid!"',
      expect.any(Error)
    );
  });

  it('handles invalid variable names (e.g., starting with number)', () => {
    const result = interpolateTemplate('~{123abc}', {});
    expect(result).toBe('~{123abc}');
    expect(mockConsoleWarn).toHaveBeenCalled();
  });

  it('falls back on malformed ternary (missing colon)', () => {
    expect(interpolateTemplate('~{a ? b}', {})).toBe('~{a ? b}');
    expect(mockConsoleWarn).toHaveBeenCalled();
  });

  it('falls back on ternary with empty parts', () => {
    expect(interpolateTemplate('~{ ? "a" : "b" }', {})).toBe('~{ ? "a" : "b" }');
    expect(mockConsoleWarn).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// interpolate: RECURSIVE tests (objects/arrays)
// ─────────────────────────────────────────────

describe('interpolate (recursive)', () => {
  it('interpolates objects recursively', () => {
    const template = {
      path: 'user/~{id}',
      label: '~{active ? "enabled" : "disabled"}',
      meta: {
        env: '~{env}'
      }
    };
    const context = { id: 42, active: true, env: 'prod' };
    const result = interpolate(template, context);
    expect(result).toEqual({
      path: 'user/42',
      label: 'enabled',
      meta: { env: 'prod' }
    });
  });

  it('interpolates arrays', () => {
    const result = interpolate(['~{a}', '~{b}', 'static'], { a: 'X', b: 'Y' });
    expect(result).toEqual(['X', 'Y', 'static']);
  });

  it('handles nested arrays and objects', () => {
    const template = {
      items: [
        { name: '~{user1}' },
        { name: '~{user2}' }
      ]
    };
    const context = { user1: 'Alice', user2: 'Bob' };
    const result = interpolate(template, context);
    expect(result).toEqual({
      items: [
        { name: 'Alice' },
        { name: 'Bob' }
      ]
    });
  });

  it('leaves non-string primitives unchanged', () => {
    const input = { num: 42, bool: true, n: null, undef: undefined };
    expect(interpolate(input, {})).toEqual(input);
  });

  it('does not recurse into non-plain objects (e.g., Date)', () => {
    const date = new Date('2025-01-01');
    const result = interpolate({ createdAt: date }, {});
    expect(result).toEqual({ createdAt: date });
    expect(result.createdAt).toBe(date); // same reference
  });

  it('preserves error behavior from interpolateTemplate in nested strings', () => {
    const result = interpolate({ bad: '~{invalid!}' }, {});
    expect(result).toEqual({ bad: '~{invalid!}' });
    expect(mockConsoleWarn).toHaveBeenCalled();
  });

  it('works with mixed types', () => {
    const result = interpolate(
      {
        str: '~{name}',
        num: 100,
        arr: ['~{a}', 200],
        obj: { flag: '~{active}' }
      },
      { name: 'Test', a: 'A', active: false }
    );
    expect(result).toEqual({
      str: 'Test',
      num: 100,
      arr: ['A', 200],
      obj: { flag: 'false' }
    });
  });
});