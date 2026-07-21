type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 text-3xl font-bold text-purple-900">{value}</div>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}