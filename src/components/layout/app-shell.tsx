import { Link, useRouterState } from "@tanstack/react-router";
import { ExternalLink, History, Inbox, Menu, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/github-icon";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TimeAgo } from "@/components/ui/time-ago";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const SOURCE_URL = "https://github.com/duynhlab/dep-radar";

interface NavItem {
  to: "/" | "/history";
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Inbox", icon: Inbox },
  { to: "/history", label: "History", icon: History },
];

const EXTERNAL_ITEMS: Array<{ href: string; label: string }> = [
  { href: "https://github.com/duynhlab/homelab/pulls?q=is%3Apr+is%3Aopen+author%3Aapp%2Frenovate", label: "Pull requests" },
  { href: "https://github.com/duynhlab/homelab/issues/1262", label: "Audit issue" },
];

const itemClass = (active: boolean) =>
  cn(
    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
  );

function NavLinks() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5 px-2">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" || pathname.startsWith("/prs/") : pathname.startsWith(to);
        return (
          <Link key={to} to={to} aria-current={active ? "page" : undefined} className={itemClass(active)}>
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
      <div className="mt-2 px-2.5 pb-1 text-xs font-medium text-muted-foreground">On GitHub</div>
      {EXTERNAL_ITEMS.map(({ href, label }) => (
        <a key={href} href={href} target="_blank" rel="noreferrer" className={itemClass(false)}>
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          {label}
        </a>
      ))}
    </nav>
  );
}

function SidebarBody({ generatedAt }: { generatedAt: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          D
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">dep-radar</span>
          <span className="text-xs text-muted-foreground">duynhlab/homelab</span>
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto py-3">
        <NavLinks />
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[13px] font-medium">Synced</span>
          <TimeAgo iso={generatedAt} className="text-xs text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Source on GitHub"
            render={<a href={SOURCE_URL} target="_blank" rel="noreferrer" />}
          >
            <GithubIcon className="size-4" aria-hidden="true" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

/** Persistent product navigation: fixed sidebar from lg, sheet drawer below. */
export function AppShell({ generatedAt, children }: { generatedAt: string; children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-card focus-visible:px-3 focus-visible:py-2"
      >
        Skip to content
      </a>
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar lg:block">
        <SidebarBody generatedAt={generatedAt} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-13 items-center gap-2 border-b px-4 lg:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation" />}>
              <Menu className="size-4" aria-hidden />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarBody generatedAt={generatedAt} />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold tracking-tight">dep-radar</span>
          <span className="ms-auto text-xs text-muted-foreground">
            synced <TimeAgo iso={generatedAt} />
          </span>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
