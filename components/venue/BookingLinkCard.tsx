'use client';

import { useState, useEffect } from 'react';

export function BookingLinkCard() {
  const [bookingUrl, setBookingUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchBookingLink() {
      try {
        const response = await fetch('/api/venue/booking-link');
        if (response.ok) {
          const data = await response.json();
          setBookingUrl(data.bookingUrl);
        }
      } catch (error) {
        console.error('Error fetching booking link:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookingLink();
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#e7dfd4] bg-white p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-[#f1e9df] rounded w-32 mb-4"></div>
          <div className="h-10 bg-[#f1e9df] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#e7dfd4] bg-white p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#3f3a33]">Public Booking Page</h3>
          <p className="text-sm text-[#6f6453] mt-1">
            Share this link with clients to receive booking inquiries
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-[#fef1e4] border border-[#f0bda4] rounded-2xl px-4 py-3">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-[#a87b3b] hover:text-[#8a6530] break-all"
          >
            {bookingUrl}
          </a>
        </div>

        <button
          onClick={copyToClipboard}
          className="px-6 py-3 bg-[#f0bda4] text-[#624230] font-semibold rounded-2xl hover:bg-[#eba98a] transition-colors flex items-center gap-2"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>
      </div>

      <div className="mt-4 p-4 bg-[#f0f7f1] rounded-2xl">
        <p className="text-xs text-[#3c8650] font-medium mb-2">💡 How to use:</p>
        <ul className="text-xs text-[#4d463b] space-y-1">
          <li>• Add this link to your website's "Book Now" button</li>
          <li>• Share it in emails or social media</li>
          <li>• Include it in your marketing materials</li>
          <li>• Embed it as an iframe on your site</li>
        </ul>
      </div>
    </div>
  );
}
