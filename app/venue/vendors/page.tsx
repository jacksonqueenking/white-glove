import { VendorsManager } from "../../../components/venue/VendorsManager";

export default function VenueVendorsPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Vendors</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your approved vendor relationships and invitations.
        </p>
      </header>
      <VendorsManager />
    </section>
  );
}
