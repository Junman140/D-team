"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      className="studio-sign-out"
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/studio/sign-in");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
