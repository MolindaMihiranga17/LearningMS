"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <h1 className="text-lg font-semibold text-[#17181B]">Something went wrong</h1>
          <p className="text-sm text-[#17181B]/60">
            {process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred. Please try again."}
          </p>
          {error.digest ? (
            <p className="text-xs text-[#17181B]/40">Reference: {error.digest}</p>
          ) : null}
          <button
            onClick={reset}
            className="mt-2 rounded-md border border-[#17181B]/15 px-4 py-2 text-sm font-medium text-[#17181B] hover:bg-[#17181B]/5"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
