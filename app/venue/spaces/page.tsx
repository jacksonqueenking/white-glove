import { SpacesManager } from "../../../components/venue/SpacesManager";

export default function VenueSpacesPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Spaces</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage your venue's event spaces, capacity, and photos.
          </p>
        </div>
      </header>
      <SpacesManager />
    </section>
  );
}
