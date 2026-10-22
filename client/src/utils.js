export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
export function completionPercent(habits, date=todayISO()) {
  if (!habits.length) return 0;
  return Math.round(habits.filter(h => (h.logs || []).some(l => String(l.date).slice(0,10) === date && l.done)).length / habits.length * 100);
}
export function daysForHeatmap(logs, days=84) {
  const completed = new Set(logs.filter(l=>l.done).map(l=>String(l.date).slice(0,10)));
  const result=[];
  for(let i=days-1;i>=0;i--){
    const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-i);
    const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    result.push({date,done:completed.has(date)});
  }
  return result;
}
