const weekday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

export function isScheduledDay(date, frequency) {
  if (frequency === 'weekly') return weekday(date) === 1; // weekly target: Monday
  if (frequency === 'weekdays') return weekday(date) >= 1 && weekday(date) <= 5;
  return true;
}

/**
 * Compute streaks over ISO YYYY-MM-DD dates.
 * A streak counts consecutive scheduled days with a completed log.
 * `today` is included if scheduled; if today has not been completed yet,
 * yesterday's active streak is preserved until today ends.
 */
export function calculateStreaks({ dates, frequency = 'daily', today }) {
  const completed = new Set(dates);
  const day = new Date(`${today}T12:00:00Z`);
  const iso = (d) => d.toISOString().slice(0, 10);
  const scheduled = (d) => isScheduledDay(iso(d), frequency);

  let current = 0;
  let cursor = new Date(day);
  // If today is scheduled but not completed, evaluate the active streak from yesterday.
  if (scheduled(cursor) && !completed.has(iso(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (scheduled(cursor) && completed.has(iso(cursor))) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    // Skip non-scheduled days without breaking the streak.
    while (!scheduled(cursor) && cursor.getTime() > 0) cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const all = [...completed].sort();
  let longest = 0, run = 0, prev = null;
  for (const date of all) {
    const d = new Date(`${date}T12:00:00Z`);
    if (!scheduled(d)) continue;
    if (prev === null) run = 1;
    else {
      let cursor2 = new Date(`${prev}T12:00:00Z`);
      cursor2.setUTCDate(cursor2.getUTCDate() + 1);
      while (!scheduled(cursor2) && cursor2 < d) cursor2.setUTCDate(cursor2.getUTCDate() + 1);
      run = iso(cursor2) === date ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
    prev = date;
  }
  return { current, longest };
}
