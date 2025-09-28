"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { OctagonAlertIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { FaGithub, FaGoogle } from "react-icons/fa";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
  Form,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: "Password is required" }),
});

export const SignInView = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);

    authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
          router.push("/");
        },
        onError: ({ error }) => {
          setError(error.message);
        },
      }
    );
  };

  const onSocial = (provider: "github" | "google") => {
    setError(null);
    setPending(true);

    authClient.signIn.social(
      {
        provider: provider,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setError(error.message);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 w-full max-w-4xl mx-auto shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Branding block */}
          <div className="bg-gradient-to-br from-green-700 to-green-900 flex flex-col gap-y-3 items-center justify-center h-full py-8 text-white order-first md:order-last">
            {/* Logo + Name side by side */}
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="AgentMeet" width={48} height={48} />
              <p className="text-2xl md:text-3xl font-bold">AgentMeet</p>
            </div>
            {/* Tagline */}
            <p className="text-xs md:text-sm text-green-100 px-6 text-center max-w-xs">
              Your AI-powered meeting assistant
            </p>
          </div>

          {/* Form section */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-6 md:p-8 flex flex-col gap-6"
            >
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl md:text-3xl font-bold">Welcome Back</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Login to your account
                </p>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="hire@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!!error && (
                <Alert className="bg-destructive/10 border-none">
                  <OctagonAlertIcon className="h-4 w-4 text-destructive" />
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}

              <Button disabled={pending} type="submit" className="w-full">
                Sign in
              </Button>

              <div className="relative text-center text-sm">
                <span className="bg-card px-2 relative z-10 text-muted-foreground">
                  Or continue with
                </span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-border -z-0"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  disabled={pending}
                  onClick={() => onSocial("google")}
                  variant="outline"
                  type="button"
                  className="w-full"
                >
                  <FaGoogle />
                </Button>
                <Button
                  disabled={pending}
                  onClick={() => onSocial("github")}
                  variant="outline"
                  type="button"
                  className="w-full"
                >
                  <FaGithub />
                </Button>
              </div>

              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="underline underline-offset-4 text-primary"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs">
        By clicking, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms and Conditions
        </a>
      </div>
    </div>
  );
};
