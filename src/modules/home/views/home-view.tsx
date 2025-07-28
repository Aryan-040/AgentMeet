"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const HomeView = () => {
    const router = useRouter();
  const{data: session} = authClient.useSession();

  if(!session){
    return(
      <p>Loading...</p>
    )
  }
  return(
  <div className="flex flex-col p-4 gap-y-4">
  <p> Logged in as {session.user.name}</p>
  <Button
    className="bg-green-600 hover:bg-green-700 text-white border border-green-700"
    onClick={() => authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/sign-in")}})}>
    Sign out
  </Button>
</div>
);
}
