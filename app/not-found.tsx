import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="font-heading text-6xl font-bold bg-gradient-to-r from-kartigo-indigo to-kartigo-coral bg-clip-text text-transparent">404</h1>
      <p className="text-muted-foreground mt-2">Oops! This page wandered off.</p>
      <Link href="/"><Button className="mt-6">Back to Home</Button></Link>
    </div>
  );
}
