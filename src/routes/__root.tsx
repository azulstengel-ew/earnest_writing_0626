import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectsProvider } from "@/lib/projects-store";
import { AuthProvider } from "@/hooks/use-auth";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Go home</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. You can try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Try again</button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Earnest Writing — A calm home for your words" },
      { name: "description", content: "A literary writing platform for novelists, screenwriters, academics, and content creators." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23F47920'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-family='Georgia,serif' fill='white'%3EE%3C/text%3E%3C/svg%3E",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: [
          "https://fonts.googleapis.com/css2?",
          "family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400",
          "&family=Courier+Prime:ital,wght@0,400;0,700;1,400",
          "&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700",
          "&family=Inter:wght@400;500;600;700",
          "&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400",
          "&family=Special+Elite",
          "&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400",
          "&family=IBM+Plex+Sans:wght@400;500;600",
          "&family=Nunito:wght@400;500;600;700",
          "&family=Bebas+Neue",
          "&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400",
          "&family=IM+Fell+English:ital@0;1",
          "&family=Lora:ital,wght@0,400;0,500;0,600;1,400",
          "&display=swap",
        ].join(""),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProjectsProvider>
          <Outlet />
        </ProjectsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
