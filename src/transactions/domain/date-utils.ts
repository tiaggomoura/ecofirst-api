export function addMonthsSameDay(base: Date, months: number): Date {
  const d = new Date(base);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months, 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}
