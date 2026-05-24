"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

export default function Navbar() {

  const { isSignedIn } = useUser();

  return (

    <header className="sticky top-0 z-50 border-b border-neutral-900 bg-black/70 backdrop-blur-xl">

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* LEFT */}

        <div className="flex items-center gap-4">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 shadow-[0_0_30px_rgba(255,107,44,0.2)]">

            <div className="h-3.5 w-3.5 rotate-45 bg-orange-500" />

          </div>

          <div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">

              FinRAG

            </h1>

            <p className="text-sm text-neutral-500">

              Financial Intelligence

            </p>

          </div>

        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-4">

          <div className="hidden rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-400 md:flex">

            <span className="mr-2 text-green-400">●</span>
            33 chunks indexed

          </div>

          <ThemeToggle />

          {isSignedIn ? (

            <UserButton afterSignOutUrl="/" />

          ) : (

            <SignInButton mode="modal">

              <button className="rounded-xl border border-neutral-800 bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition-all hover:border-orange-500/40 hover:bg-neutral-900">

                Sign In

              </button>

            </SignInButton>

          )}

          <button className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-orange-400 hover:shadow-[0_0_25px_rgba(255,107,44,0.35)]">

            + Add Documents

          </button>

        </div>

      </div>

    </header>

  );

}