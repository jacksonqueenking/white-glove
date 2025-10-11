import { ContractBilling } from "../../../../../components/event/ContractBilling";

interface ContractPageProps {
  params: Promise<{ eventId: string }>;
}

const PAYMENT_ELEMENTS = [
  {
    id: "venue",
    name: "Venue Rental",
    status: "Paid in full",
    total: "$2,500",
    schedule: [
      { label: "Deposit (50%)", due: "Paid Jun 15", amount: "$1,250", status: "Paid" as const },
      { label: "Remaining balance", due: "Paid Sep 15", amount: "$1,250", status: "Paid" as const },
    ],
  },
  {
    id: "catering",
    name: "Catering",
    status: "Deposit paid",
    total: "$8,000",
    schedule: [
      { label: "Deposit (50%)", due: "Paid Sep 20", amount: "$4,000", status: "Paid" as const },
      { label: "Final payment", due: "Due Oct 8", amount: "$4,000", status: "Awaiting payment" as const },
    ],
  },
  {
    id: "photography",
    name: "Photography",
    status: "Unpaid",
    total: "$2,000",
    schedule: [
      { label: "Full payment", due: "Due Oct 1", amount: "$2,000", status: "Awaiting payment" as const },
    ],
  },
];

const PAYMENT_HISTORY = [
  { id: "p1", date: "Sep 20, 2025", description: "Catering deposit", amount: "$4,000", status: "Paid" },
  { id: "p2", date: "Sep 15, 2025", description: "Venue final balance", amount: "$1,250", status: "Paid" },
  { id: "p3", date: "Jun 15, 2025", description: "Venue deposit", amount: "$1,250", status: "Paid" },
];

const TOTALS = {
  total: 12500,
  paid: 6500,
  outstanding: 6000,
};

// Client contract and billing with Stripe payment flow.
export default async function ContractAndBillingPage({ params }: ContractPageProps) {
  const { eventId } = await params;

  return (
    <ContractBilling
      eventId={eventId}
      elements={PAYMENT_ELEMENTS}
      paymentHistory={PAYMENT_HISTORY}
      totals={TOTALS}
      mode="client"
    />
  );
}
