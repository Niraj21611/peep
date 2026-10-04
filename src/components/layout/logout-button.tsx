"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      variant="outline"
      size="sm"
      type="submit"
      disabled={pending}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Sign Out
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmitButton />
    </form>
  );
}
