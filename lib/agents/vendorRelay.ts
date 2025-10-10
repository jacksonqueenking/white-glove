interface VendorRelayMessage {
  threadId: string;
  venueId: string;
  vendorId: string;
  content: string;
}

// Vendors do not have chat assistants; this helper formats venue AI messages relayed to vendors.
export async function relayMessageToVendor(message: VendorRelayMessage) {
  // TODO: Use lib/messaging services to post to the appropriate thread and notify vendors.
  return { delivered: true, threadId: message.threadId };
}
