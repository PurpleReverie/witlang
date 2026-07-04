import { describe, it, expect } from 'vitest';
import { parse } from '@witlang/parser';
import type { DataDef } from '@witlang/parser';
import { loadExternalData, toDataValue, type DataLoader } from './data-loader.js';
import { resolve } from './resolver.js';
import { expand } from './expander.js';
import { RuntimeError, RuntimeErrorCode } from './errors.js';

// An embedded host resolves loads from an in-memory map — no subprocess.
// This is exactly the surface a program using @witlang/runtime would use.
const DATA: Record<string, unknown> = {
  meta: { version: '0.4.0', date: '2026-07-05' },
  team: [
    { name: 'TauraJ', commits: 42 },
    { name: 'Ada', commits: 17 },
  ],
};
const mapLoader: DataLoader = (req) => {
  if (!(req.alias in DATA)) throw new Error(`unknown alias "${req.alias}"`);
  return DATA[req.alias];
};

function flat(nodes: unknown): string {
  return JSON.stringify(nodes);
}

describe('loadExternalData — @load → DataDef rewrite', () => {
  it('rewrites a @load use into a DataDef of the same name', () => {
    const doc = loadExternalData(parse('@load meta load@\n', '<inline>'), mapLoader);
    expect(doc.children).toHaveLength(1);
    const def = doc.children[0] as DataDef;
    expect(def.kind).toBe('dataDef');
    expect(def.name).toBe('meta');
    expect(def.value.kind).toBe('record');
  });

  it('accepts a plain dictionary as the source', () => {
    const doc = loadExternalData(parse('@load meta load@\n', '<inline>'), {
      meta: { version: '9.9.9' },
    });
    const def = doc.children[0] as DataDef;
    expect(def.name).toBe('meta');
    expect(JSON.stringify(def.value)).toContain('9.9.9');
  });

  it('honours |as name| as the binding name (all-pipes form)', () => {
    const doc = loadExternalData(
      parse('@load |from meta| |as info| load@\n', '<inline>'),
      mapLoader,
    );
    const def = doc.children[0] as DataDef;
    expect(def.name).toBe('info');
  });

  it('passes captures to the loader as args', () => {
    let seen: Record<string, string> | undefined;
    const spy: DataLoader = (req) => {
      seen = req.args;
      return { ok: true };
    };
    loadExternalData(
      parse('@load |from cite| |key devlin2019| load@\n', '<inline>'),
      spy,
    );
    expect(seen).toEqual({ key: 'devlin2019' });
  });

  it('throws E_LOAD_FAILED at the load site when the loader throws', () => {
    try {
      loadExternalData(parse('@load nope load@\n', '<inline>'), mapLoader);
      throw new Error('expected a throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RuntimeError);
      expect((err as RuntimeError).code).toBe(RuntimeErrorCode.E_LOAD_FAILED);
    }
  });

  it('errors when @load has no alias', () => {
    expect(() => loadExternalData(parse('@load load@\n', '<inline>'), mapLoader))
      .toThrow(/needs an alias/);
  });
});

describe('loadExternalData — end to end through resolve + expand', () => {
  it('loaded record fields resolve via @name.field', () => {
    const src = '@load meta load@\n\nRelease @meta.version built @meta.date here.\n';
    const doc = loadExternalData(parse(src, '<inline>'), mapLoader);
    const expanded = expand(resolve(doc));
    const out = flat(expanded.children);
    expect(out).toContain('0.4.0');
    expect(out).toContain('2026-07-05');
  });

  it('loaded collections iterate via (each …)', () => {
    const src =
      '@load team load@\n\n@ul\n(each @team as p) @li @p.name has @p.commits commits li@ (end)\nul@\n';
    const doc = loadExternalData(parse(src, '<inline>'), mapLoader);
    const expanded = expand(resolve(doc));
    const out = flat(expanded.children);
    expect(out).toContain('TauraJ');
    expect(out).toContain('42');
    expect(out).toContain('Ada');
    expect(out).toContain('17');
  });
});

describe('toDataValue — JSON → Wit value model', () => {
  const loc = { file: '', line: 1, col: 1, offset: 0, length: 0 };

  it('maps primitives', () => {
    expect(toDataValue('hi', loc)).toMatchObject({ kind: 'stringValue', value: 'hi' });
    expect(toDataValue(7, loc)).toMatchObject({ kind: 'numberValue', value: 7 });
    expect(toDataValue(true, loc)).toMatchObject({ kind: 'booleanValue', value: true });
    expect(toDataValue(null, loc)).toMatchObject({ kind: 'nullValue' });
  });

  it('maps arrays to collections and objects to records', () => {
    const coll = toDataValue([1, 2], loc);
    expect(coll.kind).toBe('collection');
    const rec = toDataValue({ a: 1 }, loc);
    expect(rec.kind).toBe('record');
    if (rec.kind === 'record') {
      expect(rec.fields[0]).toMatchObject({ key: 'a' });
    }
  });
});
