/**
 * AI Agent System - Main Export
 */

// System prompt generators
export {
  generateClientSystemPrompt,
  generateVenueGeneralSystemPrompt,
  generateVenueEventSystemPrompt,
  generateVendorContextPrompt,
} from './prompts';

// Tool definitions
export {
  clientTools,
  venueGeneralTools,
  venueEventTools,
  vendorTools,
  getToolsForAgent,
  type ToolContext,
} from './tools';

// Context building
export {
  buildClientContext,
  buildVenueGeneralContext,
  buildVenueEventContext,
  buildVendorContext,
} from './context';

// Legacy assistant classes (placeholders)
export { ClientAssistant } from './clientAssistant';
export { VenueAssistant } from './venueAssistant';
export { relayMessageToVendor } from './vendorRelay';
