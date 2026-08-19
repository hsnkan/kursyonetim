import { redirect } from "next/navigation";

// Kök dizin: middleware oturum kontrolü yapar; burada yedek yönlendirme
export default function HomePage() {
  redirect("/auth/login");
}
