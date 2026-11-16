import { Link } from "react-router-dom";
import { Brand } from "@/components/shell/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-[420px] text-center">
        <Brand />
        <h1 className="display-md mt-8">Page not found</h1>
        <p className="mt-3 text-[14px] text-muted">The address may be mistyped, or the page may have moved.</p>
        <Button asChild className="mt-6">
          <Link to="/">Go to start</Link>
        </Button>
      </div>
    </main>
  );
}
