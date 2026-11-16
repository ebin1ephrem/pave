import { Link } from "react-router-dom";
import { Brand } from "@/components/shell/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-[420px] text-center">
        <Link to="/" aria-label="PAVE, home" className="inline-flex">
          <Brand />
        </Link>
        <h1 className="display-md mt-8">This page does not exist.</h1>
        <p className="mt-3 text-[14px] text-muted">The link may be old or mistyped.</p>
        <Button asChild className="mt-6">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
