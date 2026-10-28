import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/github-icon";
import { TimeAgo } from "@/components/ui/time-ago";
import { Tooltip } from "@/components/ui/tooltip";
import { HEADER_CONTAINER } from "./page-container";
import { ThemeToggle } from "./theme-toggle";

const SOURCE_URL = "https://github.com/duynhlab/dep-radar";

export function AppHeader({ generatedAt }: { generatedAt: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className={`${HEADER_CONTAINER} flex h-14 items-center gap-3 px-4 sm:px-6`}>
        <Link to="/" className="flex items-center gap-2 text-body font-semibold text-fg">
          <span aria-hidden="true">📥</span>
          dep-radar
          <span className="hidden font-normal text-fg-muted sm:inline">· homelab</span>
        </Link>
        {/* The timestamp answers "is this current?", so it stays at every
            width; only the word is dropped on mobile. */}
        <span className="ml-auto min-w-0 truncate text-meta text-fg-muted">
          <span className="hidden sm:inline">synced </span>
          <TimeAgo iso={generatedAt} />
        </span>
        <Tooltip label="Source on GitHub">
          <Button size="icon" variant="ghost" asChild>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer" aria-label="dep-radar source code on GitHub">
              <GithubIcon className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </Tooltip>
        <ThemeToggle />
      </div>
    </header>
  );
}
