import { Leaf } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">
            Agroturismo <span className="text-primary">Panama</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turismo Rural y Sostenible
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
