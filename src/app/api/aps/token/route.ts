import { NextResponse } from "next/server";
import secret from "../../../../../secret.json";

export async function GET() {
  const res = await fetch("https://developer.api.autodesk.com/authentication/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: secret.clientId,
      client_secret: secret.clientSecret,
      grant_type: "client_credentials",
      scope: "viewables:read",
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Token fetch failed" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ access_token: data.access_token, expires_in: data.expires_in });
}
