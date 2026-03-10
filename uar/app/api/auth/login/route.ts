import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://devapiuar.triasmitra.com/api";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || "Login gagal" },
      { status: res.status }
    );
  }

  const response = NextResponse.json({
    user: data.user,
  });

  response.cookies.set("token", data.token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });

  return response;
}