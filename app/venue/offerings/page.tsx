import { OfferingsManager } from "../../../components/venue/OfferingsManager";

export default function VenueOfferingsPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Offerings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your venue's services, equipment, and elements available for events.
        </p>
      </header>
      <OfferingsManager />
    </section>
  );
}
