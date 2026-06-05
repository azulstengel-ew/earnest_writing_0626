import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span>© 2025 Earnest Writing</span>
        <span className="hidden sm:inline text-border">·</span>
        <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
        <span className="hidden sm:inline text-border">·</span>
        <Link to="/how-to-use" className="hover:text-foreground transition-colors">How to Use</Link>
        <span className="hidden sm:inline text-border">·</span>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        <span className="hidden sm:inline text-border">·</span>
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        <span className="hidden sm:inline text-border">·</span>
        <a href="mailto:contact@earnestwriting.com" className="hover:text-foreground transition-colors">Contact</a>
      </div>
    </footer>
  );
}
