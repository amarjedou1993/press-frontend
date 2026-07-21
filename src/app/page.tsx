// src/app/page.tsx
// The root route. Until the public landing page arrives in week 2, the
// root sends visitors straight to login. Server-side redirect — instant,
// no flash of content.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
