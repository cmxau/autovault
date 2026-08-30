import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { SearchX, TriangleAlert } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/navigation/app-shell";
import { ErrorPage } from "@/components/autovault/error-page";
import { GarageProvider } from "@/hooks/use-garage";
import { Toaster } from "@/components/ui/sonner";
import { applyStoredTheme } from "@/hooks/use-theme";

function NotFoundComponent() {
  return (
    <ErrorPage
      code={404}
      icon={SearchX}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
      <span className="glass grid size-16 place-items-center rounded-[20px] text-muted-foreground">
        <TriangleAlert className="size-7" strokeWidth={1.4} />
      </span>
      <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.015em]">This page didn't load</h1>
      <p className="mx-auto mt-2 max-w-[38ch] text-[14px] leading-relaxed text-muted-foreground">
        Something went wrong rendering this screen. You can try again or head back home.
      </p>
      <div className="mt-7 flex w-full max-w-[280px] flex-col gap-2.5">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="focus-ring inline-flex min-h-[48px] items-center justify-center rounded-[14px] bg-primary text-[15.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/92"
        >
          Try again
        </button>
        <a
          href="/"
          className="focus-ring inline-flex min-h-[48px] items-center justify-center rounded-[14px] border border-hairline text-[15.5px] font-medium text-foreground transition-colors hover:bg-accent"
        >
          Go to Garage
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "AutoVault: A private home for your vehicles" },
      {
        name: "description",
        content:
          "AutoVault keeps mileage, service history, documents and reminders for every vehicle you own, stored privately on your device.",
      },
      { name: "theme-color", content: "#f6f7f9" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "AutoVault" },
      { property: "og:site_name", content: "AutoVault" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", href: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname.startsWith("/welcome");

  useEffect(() => {
    applyStoredTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyStoredTheme();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GarageProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        {bare ? <Outlet /> : <AppShell>{<Outlet />}</AppShell>}
        <Toaster position="top-center" />
      </GarageProvider>
    </QueryClientProvider>
  );
}
