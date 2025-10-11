'use client';

interface Guest {
  id: string;
  name: string;
  email: string;
  rsvp: "yes" | "no" | "pending";
  dietary?: string;
  phone?: string;
  notes?: string;
  plusOne?: boolean;
}

interface GuestListProps {
  guests: Guest[];
  eventId: string;
  mode?: "client" | "venue";
  onAddGuest?: () => void;
  onImportCSV?: () => void;
  onExport?: () => void;
  onEditGuest?: (guestId: string) => void;
  onDeleteGuests?: (guestIds: string[]) => void;
}

// Unified guest list component for client (editable) and venue (read-only) views.
export function GuestList({
  guests,
  eventId,
  mode = "client",
  onAddGuest,
  onImportCSV,
  onExport,
  onEditGuest,
  onDeleteGuests,
}: GuestListProps) {
  const rsvpSummary = guests.reduce(
    (acc, guest) => {
      acc[guest.rsvp] += 1;
      return acc;
    },
    { yes: 0, no: 0, pending: 0 },
  );

  const isVenue = mode === "venue";

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#3f3a33]">
            {isVenue ? "Guest List" : `Guests (${rsvpSummary.yes}/${guests.length})`}
          </h1>
          <p className="mt-1 text-sm text-[#6f6453]">
            {isVenue
              ? `Event ${eventId} • ${rsvpSummary.yes} attending of ${guests.length} invited`
              : `Manage your guest list and track RSVPs`}
          </p>
        </div>
        <div className="flex gap-3">
          {!isVenue && (
            <>
              <button
                type="button"
                onClick={onAddGuest}
                className="inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-5 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
              >
                + Add Guest
              </button>
              <button
                type="button"
                onClick={onImportCSV}
                className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-5 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
              >
                📤 Import CSV
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-5 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
          >
            {isVenue ? "Export List" : "Export"}
          </button>
        </div>
      </header>

      <div className="rounded-3xl border border-[#e7dfd4] bg-[#fff8ee] p-6">
        <h2 className="text-sm font-semibold text-[#4d463b]">RSVP Summary</h2>
        <div className="mt-4 grid grid-cols-3 gap-6">
          <div className="rounded-2xl bg-[#e4f1e6] px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3c8650]">
              {isVenue ? "Attending" : "Yes"}
            </p>
            <p className="mt-1 text-3xl font-bold text-[#3c8650]">{rsvpSummary.yes}</p>
          </div>
          <div className="rounded-2xl bg-[#fde9e1] px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c96f3a]">
              {isVenue ? "Declined" : "No"}
            </p>
            <p className="mt-1 text-3xl font-bold text-[#c96f3a]">{rsvpSummary.no}</p>
          </div>
          <div className="rounded-2xl bg-[#f6e7d0] px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a87b3b]">
              {isVenue ? "Pending" : "Undecided"}
            </p>
            <p className="mt-1 text-3xl font-bold text-[#a87b3b]">{rsvpSummary.pending}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#e7dfd4] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e7dfd4]">
                {!isVenue && (
                  <th className="px-6 py-4 text-left">
                    <input type="checkbox" className="rounded border-[#e7dfd4]" />
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                  Email
                </th>
                {!isVenue && (
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                    Phone
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                  RSVP
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                  Dietary
                </th>
                {!isVenue && (
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {guests.map((guest, index) => (
                <tr
                  key={guest.id}
                  className={index !== guests.length - 1 ? "border-b border-[#f5f0e8]" : ""}
                >
                  {!isVenue && (
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-[#e7dfd4]" />
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm font-medium text-[#3f3a33]">{guest.name}</td>
                  <td className="px-6 py-4 text-sm text-[#6f6453]">{guest.email}</td>
                  {!isVenue && (
                    <td className="px-6 py-4 text-sm text-[#6f6453]">{guest.phone || "—"}</td>
                  )}
                  <td className="px-6 py-4">
                    {guest.rsvp === "yes" && (
                      <span className="inline-flex items-center rounded-full bg-[#e4f1e6] px-3 py-1 text-xs font-medium text-[#3c8650]">
                        {isVenue ? "Attending" : "Yes"}
                      </span>
                    )}
                    {guest.rsvp === "no" && (
                      <span className="inline-flex items-center rounded-full bg-[#fde9e1] px-3 py-1 text-xs font-medium text-[#c96f3a]">
                        {isVenue ? "Declined" : "No"}
                      </span>
                    )}
                    {guest.rsvp === "pending" && (
                      <span className="inline-flex items-center rounded-full bg-[#f6e7d0] px-3 py-1 text-xs font-medium text-[#a87b3b]">
                        {isVenue ? "Pending" : "Undecided"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6f6453]">{guest.dietary || "—"}</td>
                  {!isVenue && (
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onEditGuest?.(guest.id)}
                        className="text-xs font-medium text-[#a87b3b] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isVenue && guests.length === 0 && (
        <div className="rounded-3xl border border-[#e7dfd4] bg-white p-12 text-center">
          <p className="text-sm text-[#a18a72]">No guests added yet. Add your first guest to get started.</p>
          <button
            type="button"
            onClick={onAddGuest}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-5 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
          >
            + Add Guest
          </button>
        </div>
      )}
    </section>
  );
}
