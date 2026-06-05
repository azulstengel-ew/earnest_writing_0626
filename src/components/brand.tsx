import { Link } from "@tanstack/react-router";
import foxImg from "@/assets/earnest_writing_logo.png";

export function FoxLogo({ className = "h-10 w-10", float = false }: { className?: string; float?: boolean }) {
  return (
    <img
      src={foxImg}
      alt="Earnest Writing fox mascot"
      width={1024}
      height={1024}
      suppressHydrationWarning
      className={`${className} object-contain ${float ? "animate-fox-float" : ""}`}
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <FoxLogo className="h-8 w-8" />
      <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
        Earnest <span className="text-accent">Writing</span>
      </span>
    </Link>
  );
}
