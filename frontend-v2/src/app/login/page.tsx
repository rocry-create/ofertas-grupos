"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { setToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ofertas.allcepts.com/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@allcepts.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao entrar");
      setToken(data.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border shadow-lg">
        <CardContent className="pt-2 pb-6 px-6">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-3">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-bold">Catalogo Viral Inteligente</h1>
            <p className="text-sm text-muted-foreground">Entre para continuar</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
