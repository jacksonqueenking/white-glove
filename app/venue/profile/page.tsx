import { VenueProfileForm } from "../../../components/venue/VenueProfileForm";

export default function VenueProfilePage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Venue Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your venue's business information, contact details, and booking settings.
        </p>
      </header>
      <VenueProfileForm />
    </section>
  );
}
