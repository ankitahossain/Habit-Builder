import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreaks, isScheduledDay } from './streaks.js';

test('daily streak counts consecutive completed days', () => {
  assert.deepEqual(calculateStreaks({
    dates: ['2026-10-19','2026-10-20','2026-10-21'],
    today: '2026-10-21'
  }), { current: 3, longest: 3 });
});

test('missed scheduled day breaks current streak', () => {
  assert.deepEqual(calculateStreaks({
    dates: ['2026-10-17','2026-10-19'],
    today: '2026-10-21'
  }), { current: 0, longest: 1 });
});

test('weekends are skipped for weekday habits', () => {
  assert.equal(isScheduledDay('2026-10-24','weekdays'), false);
  assert.deepEqual(calculateStreaks({
    dates: ['2026-10-23','2026-10-26'],
    frequency: 'weekdays',
    today: '2026-10-26'
  }), { current: 2, longest: 2 });
});
