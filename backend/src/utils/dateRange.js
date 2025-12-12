export function normalizeDateRange(start, end) {
  if (!start || !end) throw new Error('start and end are required');

  const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

  const s = isDateOnly(start) ? `${start} 00:00:00` : start;
  const e = isDateOnly(end) ? `${end} 23:59:59` : end;

  return [s, e];
}
