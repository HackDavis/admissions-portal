import { useState } from 'react';
import { useMailchimp } from '../_hooks/useMailchimp';
import { incrementMailchimpApiKeyIndex } from '@utils/mailchimp/mailchimpApiStatus';

export function MailchimpApiStatusModal() {
  const [showMore, setShowMore] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { mailchimp, refresh: refreshMailchimp } = useMailchimp();
  const mc = mailchimp ?? {
    batchNumber: 'N/A',
    apiCallsMade: 0,
    maxApiCalls: 0,
    apiKeyIndex: 0,
    maxApiKeys: 0,
    lastUpdate: 'N/A',
    lastReset: 'N/A',
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date || date === 'N/A') return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return (
      d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      }) + ' PST'
    );
  };

  async function handleIncrementApiKey() {
    setIsProcessing(true);
    setIsPopupOpen(true);
    try {
      await incrementMailchimpApiKeyIndex();
    } catch (err: any) {
      alert('Error incrementing API key:' + err.message);
    } finally {
      await refreshMailchimp();
      setIsProcessing(false);
      setIsPopupOpen(false);
    }
  }

  return (
    <div>
      <p className="mt-1 text-xs">-- Batch: {mc.batchNumber} --</p>
      <p className="mt-1 text-xs font-semibold">Mailchimp API status</p>
      <p className="mt-1 text-xs">
        Sent: {mc.apiCallsMade}/{mc.maxApiCalls} (key #{mc.apiKeyIndex}/
        {mc.maxApiKeys})
      </p>
      <button
        onClick={() => setShowMore(!showMore)}
        className="mt-1 text-xs underline text-gray-500 hover:text-black"
      >
        {showMore ? 'show less' : 'show more...'}
      </button>

      {showMore && (
        <>
          <p className="mt-1 text-xs">
            Last update: {formatDate(mc.lastUpdate)}
          </p>
          <p className="mt-1 text-xs">Last reset: {formatDate(mc.lastReset)}</p>
          <button
            onClick={() => setIsPopupOpen(true)}
            className="border border-red-700 bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase text-red-800"
          >
            increment api key index
          </button>
        </>
      )}

      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="border-2 border-black bg-white shadow-xl max-w-lg w-full p-6 relative">
            <h2 className="text-lg font-bold mb-4">
              increment mailchimp api key
            </h2>
            <p className="text-[13px] text-red-500 uppercase font-bold">
              Only increment if the following is satisfied:
            </p>
            <ul className="list-disc list-inside text-[13px] text-red-500 mb-4">
              <li>
                You've reached the <u>end</u> of Mailchimp's 14 day trial for
                the current account <b>(key #{mc.apiKeyIndex})</b>, and need to{' '}
                <u>manually</u> increment the key
              </li>
              <li>
                The <u>next</u> Mailchimp account{' '}
                <b>(key #{mc.apiKeyIndex + 1})</b> has{' '}
                <u>14 day trial enabled</u>
              </li>
            </ul>
            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsPopupOpen(false)}
                className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
                disabled={isProcessing}
              >
                cancel
              </button>
              <button
                onClick={handleIncrementApiKey}
                className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase text-white bg-black hover:bg-gray-800"
                disabled={isProcessing}
              >
                {isProcessing ? 'incrementing...' : 'increment'}
              </button>
            </div>
          </div>{' '}
        </div>
      )}
    </div>
  );
}
