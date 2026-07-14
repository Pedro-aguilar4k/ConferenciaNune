const Block = ({ className = '' }) => (
  <div className={`skeleton-block ${className}`} />
);

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando dashboard">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-3">
          <Block className="h-3 w-40" />
          <Block className="h-9 w-72" />
          <Block className="h-4 w-96 max-w-full" />
        </div>
        <Block className="h-[52px] w-64" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-[#dfe3eb] rounded-md p-4 space-y-3">
            <Block className="h-3 w-20" />
            <Block className="h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="border border-[#dfe3eb] rounded-md p-5 space-y-4">
        <Block className="h-3 w-64" />
        <div className="grid md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Block className="h-3 w-32" />
              <Block className="h-7 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-[#dfe3eb] rounded-md p-5 space-y-4">
            <Block className="h-3 w-48" />
            <Block className="h-[180px] w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
