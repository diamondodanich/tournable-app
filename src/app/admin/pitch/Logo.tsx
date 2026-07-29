/**
 * Знак Tournable. Берём готовые файлы из public: logo-white.png для тёмной темы,
 * logo-green.png для светлой. Оба варианта в разметке всегда, переключает CSS —
 * так знак не мигает при смене темы и не требует перерисовки на клиенте.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={className} aria-label="Tournable" role="img">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt="" data-logo="dark" width={512} height={512} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-green.png" alt="" data-logo="light" width={512} height={512} />
    </span>
  )
}
