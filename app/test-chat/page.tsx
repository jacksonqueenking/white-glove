/**
 * ChatKit Test Page
 *
 * Simple test page to verify ChatKit integration with Agents SDK
 */

import { ChatKitWrapper } from '@/components/chat/ChatKitWrapper';

export default function TestChatPage() {
  // For testing without real data, use undefined
  // The foreign keys allow NULL values for testing
  // In production, these would come from the actual user session and database
  const testEventId = undefined;
  const testVenueId = undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ChatKit Test Page</h1>
          <p className="mt-2 text-gray-600">
            Test the ChatKit integration with different agent types
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Agent Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Client Agent</h2>
            <ChatKitWrapper
              agentType="client"
              eventId={testEventId}
              className="h-[500px]"
              title="Test Client Assistant"
            />
          </div>

          {/* Venue General Agent Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Venue General Agent</h2>
            <ChatKitWrapper
              agentType="venue_general"
              venueId={testVenueId}
              className="h-[500px]"
              title="Test Venue Assistant"
            />
          </div>

          {/* Venue Event Agent Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Venue Event Agent</h2>
            <ChatKitWrapper
              agentType="venue_event"
              eventId={testEventId}
              venueId={testVenueId}
              className="h-[500px]"
              title="Test Event Coordinator"
            />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Testing Instructions</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>Try sending a message in each chat window</li>
            <li>Verify that the agent responds appropriately for its type</li>
            <li>Check the browser console for any errors</li>
            <li>Check the server logs (terminal) for backend processing</li>
            <li>Test the starter prompts by clicking on them</li>
          </ul>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Notes</h3>
          <ul className="list-disc list-inside space-y-2 text-yellow-800">
            <li>You need to register your domain at <a href="https://platform.openai.com/settings/organization/security/domain-allowlist" className="underline" target="_blank" rel="noopener noreferrer">OpenAI Domain Allowlist</a></li>
            <li>For localhost testing, use the domain key: <code className="bg-yellow-100 px-1 py-0.5 rounded">domain_pk_localhost_dev</code></li>
            <li>Set <code className="bg-yellow-100 px-1 py-0.5 rounded">NEXT_PUBLIC_CHATKIT_DOMAIN_KEY</code> in your <code className="bg-yellow-100 px-1 py-0.5 rounded">.env.local</code> file for production</li>
            <li>Make sure your OpenAI API key is set in <code className="bg-yellow-100 px-1 py-0.5 rounded">OPENAI_API_KEY</code></li>
            <li>⚠️ This test page uses NULL context (no event/venue) - agents will work but won't have specific data to reference</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
