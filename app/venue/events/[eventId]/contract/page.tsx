import { ContractBilling } from "../../../../../components/event/ContractBilling";

interface VenueContractPageProps {
  params: Promise<{ eventId: string }>;
}

const PAYMENT_ELEMENTS = [
  {
    id: "venue",
    name: "Venue Rental",
    description: "Main Ballroom (8 hours)",
    status: "Paid in full",
    total: "$2,500",
    schedule: [
      { label: "Full payment", due: "Oct 1, 2025", amount: "$2,500", status: "Paid" as const },
    ],
  },
  {
    id: "catering",
    name: "Catering",
    description: "Dinner service for 150 guests",
    status: "50% deposit paid",
    total: "$8,750",
    schedule: [
      { label: "Deposit (50%)", due: "Paid Oct 1", amount: "$4,375", status: "Paid" as const },
      { label: "Final payment", due: "Oct 8, 2025", amount: "$4,375", status: "Awaiting payment" as const },
    ],
  },
  {
    id: "photography",
    name: "Photography",
    description: "6-hour coverage + album",
    status: "Unpaid",
    total: "$1,200",
    schedule: [
      { label: "Full payment", due: "Oct 10, 2025", amount: "$1,200", status: "Awaiting payment" as const },
    ],
  },
];

const PAYMENT_HISTORY = [
  { id: "p1", date: "Oct 1, 2025", description: "Venue rental payment", amount: "$2,500", status: "Paid", method: "Stripe" },
  { id: "p2", date: "Oct 1, 2025", description: "Catering deposit", amount: "$4,375", status: "Paid", method: "Stripe" },
];

const TOTALS = {
  total: 12450,
  paid: 6875,
  outstanding: 5575,
};

// Venue view of contract and billing with payment tracking.
export default async function VenueContractPage({ params }: VenueContractPageProps) {
  const { eventId } = await params;

  return (
    <ContractBilling
      eventId={eventId}
      elements={PAYMENT_ELEMENTS}
      paymentHistory={PAYMENT_HISTORY}
      totals={TOTALS}
      mode="venue"
    />
  );
}
