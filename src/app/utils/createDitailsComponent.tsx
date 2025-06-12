function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-400 mb-1">{label}</h4>
      <div className="text-white">{value}</div>
    </div>
  );
}
function getFrequencyLabel(freq: string) {
  const labels: Record<string, string> = {
    once: 'Единоразово',
    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    monthly: 'Ежемесячно',
    yearly: 'Ежегодно'
  };
  return labels[freq] || freq;
}
export { DetailItem, getFrequencyLabel };