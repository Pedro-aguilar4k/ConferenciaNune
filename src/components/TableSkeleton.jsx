export default function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="bg-[#121212] border border-[#27272A] rounded-md overflow-hidden" aria-busy="true" aria-label="Carregando dados">
      <div className="flex items-center gap-4 px-4 h-[42px] bg-[#1A1A1A]">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-block h-3 flex-1" />
        ))}
      </div>
      <div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 h-[52px] border-t border-[#1A1A1A]">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="skeleton-block h-3.5 flex-1" style={{ opacity: 1 - r * 0.08 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
