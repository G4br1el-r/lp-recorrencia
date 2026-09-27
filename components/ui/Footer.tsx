import { copy } from "@/lib/content/copy";
import { links } from "@/lib/content/links";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-stage px-[var(--gutter)] py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-display text-lg font-bold text-ink">
            {copy.brand}
          </span>
          <p className="mt-2 text-xs text-ink-muted">
            <a
              className="transition-colors hover:text-ink"
              href={links.publisher}
              rel="noreferrer"
              target="_blank"
            >
              {copy.publisher}
            </a>
            <span aria-hidden="true" className="mx-2 text-ink-dim">
              ·
            </span>
            {year}
          </p>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-ink-muted">
          {copy.footer.credits}
        </p>
      </div>
    </footer>
  );
}
