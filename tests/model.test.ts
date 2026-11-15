import { describe, it, expect } from 'vitest';
import fixture from '../src/data/model.test.json';
import { run, breakeven, BASE } from '../src/lib/model';
import { withAidRule } from '../src/lib/sim';
import { num, signed, unit, pct, meur, MINUS, THIN } from '../src/lib/format';

const TOL = 1e-6;

function close(actual: number, expected: number, label: string) {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThanOrEqual(TOL);
}

describe('modelo económico (11 casos de data/model.test.json)', () => {
  it('aplica las correcciones de la memoria sobre BASE', () => {
    expect(BASE.civil_pec).toBe(fixture.base_overrides.civil_pec);
    expect(BASE.cost_staff).toBe(fixture.base_overrides.cost_staff);
  });

  it('tiene los 11 casos', () => {
    expect(fixture.cases).toHaveLength(11);
  });

  for (const c of fixture.cases) {
    it(c.name, () => {
      const over = withAidRule(c.input as Record<string, number>);
      const r = run(over);
      const e = c.expected;
      close(r.npv, e.npv, 'npv');
      close(r.irr, e.irr, 'irr');
      if (e.pb === null) expect(Number.isNaN(r.pb)).toBe(true);
      else close(r.pb, e.pb, 'pb');
      close(r.capex, e.capex, 'capex');
      close(r.sales37, e.sales37, 'sales37');
      close(r.ebitda37, e.ebitda37, 'ebitda37');
      close(breakeven(over), e.breakeven, 'breakeven');
      expect(r.fc).toHaveLength(25);
      e.fc.forEach((v, i) => close(r.fc[i], v, `fc[${2027 + i}]`));
    });
  }
});

describe('formato es-ES', () => {
  it('agrupa los miles con punto, también en cuatro cifras', () => {
    expect(num(3010)).toBe('3.010');
    expect(num(24157.303371)).toBe('24.157');
    expect(num(1234567)).toBe('1.234.567');
    expect(num(999)).toBe('999');
  });
  it('usa coma decimal', () => {
    expect(num(61.566214, 1)).toBe('61,6');
    expect(num(0.205485, 2)).toBe('0,21');
    expect(num(12714.007137, 0)).toBe('12.714');
    expect(num(3439.007137, 1)).toBe('3.439,0');
  });
  it('usa el signo menos U+2212 y no deja «−0»', () => {
    expect(num(-0.238526, 1)).toBe(MINUS + '0,2');
    expect(num(-18.09637, 1)).toBe('−1' + '8,1');
    expect(num(-0.01, 1)).toBe('0,0');
    expect(signed(9.431939, 1)).toBe('+9,4');
    expect(signed(-0.238526, 1)).toBe('−0,2');
    expect(num(-1234.5, 1)).toBe('−1.234,5');
  });
  it('separa cifra y unidad con espacio fino duro', () => {
    expect(unit(3010, 0, 't/año')).toBe('3.010' + THIN + 't/año');
    expect(pct(0.079439, 1)).toBe('7,9' + THIN + '%');
    expect(meur(-0.238526, 1)).toBe('−0,2' + THIN + 'M€');
    expect(meur(9.431939, 1, true)).toBe('+9,4' + THIN + 'M€');
  });
  it('devuelve una raya para valores no finitos', () => {
    expect(num(NaN)).toBe('—');
    expect(pct(NaN)).toBe('—');
  });
});
