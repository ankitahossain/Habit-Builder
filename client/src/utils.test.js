import { describe, it, expect } from 'vitest';
import { completionPercent } from './utils.js';
describe('completionPercent', () => {
  it('returns zero when there are no habits', () => expect(completionPercent([], '2026-10-21')).toBe(0));
  it('calculates daily completion percentage', () => {
    expect(completionPercent([
      { logs:[{date:'2026-10-21',done:true}] },
      { logs:[{date:'2026-10-21',done:false}] }
    ],'2026-10-21')).toBe(50);
  });
});
