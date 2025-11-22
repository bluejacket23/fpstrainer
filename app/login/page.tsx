"use client";
import { Authenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function LoginPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Authenticator />
    </div>
  );
}

