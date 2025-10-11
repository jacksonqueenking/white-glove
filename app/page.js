import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Check if user is authenticated and redirect to appropriate dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const userType = user.user_metadata?.user_type || 'client';
    redirect(`/${userType}/dashboard`);
  }

  return (
    <main>
      <section className="hero-card">
        <p className="badge">White Glove</p>
        <h1 className="title">AI-Powered Event Planning</h1>
        <p className="subtitle">
          Welcome to White Glove, your intelligent concierge for creating unforgettable experiences. The adventure starts here.
        </p>
        <span className="cta">Say hello to effortless events</span>
      </section>
    </main>
  );
}
