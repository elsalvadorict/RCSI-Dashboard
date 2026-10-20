"use client";

import { useState } from "react";
import { loginAsAdmin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onSuccess: () => void;
}

export function AdminLoginForm({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.message || "Login failed");
      return;
    }

    toast.success("Credentials verified");
    onSuccess();
  } catch {
    toast.error("Unable to connect to the server");
  } finally {
    setLoading(false);
  }
};

  return (
    <Card className="max-w-md mx-auto mt-12 border-cyan-500/30">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
          <Lock className="h-6 w-6 text-cyan-400" />
        </div>
        <CardTitle>Admin Access Required</CardTitle>
        <CardDescription>
          Only authorized administrators can upload data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}