import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 p-4">
      <Link href="/" className="text-xl font-bold">
        MercadoTech
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
