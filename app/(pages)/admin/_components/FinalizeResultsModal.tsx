interface FinalizeResultsModalProps {
  isOpen: boolean;
  results: {
    titoSucceeded: number;
    titoTotal: number;
    autoFixedCount: number;
    mailchimpResults: string;
    csvFilename: string;
    totalErrors: number;
    titoFailures: string[];
    mailchimpFailures: string[];
  } | null;
  onClose: () => void;
}

export function FinalizeResultsModal({
  isOpen,
  results,
  onClose,
}: FinalizeResultsModalProps) {
  if (!isOpen || !results) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-black shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">
          {results.totalErrors === 0
            ? 'Process Complete - Success!'
            : 'Process Complete - With Errors'}
        </h2>

        {/* Summary Section */}
        <div
          className={`mb-4 p-4 border-2 ${
            results.totalErrors === 0
              ? 'border-green-600 bg-green-50'
              : 'border-yellow-600 bg-yellow-50'
          }`}
        >
          <p className="text-sm font-semibold mb-2">Summary:</p>
          <ul className="text-xs space-y-1">
            <li>
              Tito Invitations: {results.titoSucceeded}/{results.titoTotal}{' '}
              succeeded
            </li>
            <li>Auto-Fixed Errors: {results.autoFixedCount}</li>
            <li>CSV Downloaded: {results.csvFilename}</li>
            {results.totalErrors > 0 && (
              <li className="font-bold text-red-600">
                Total Errors: {results.totalErrors}
              </li>
            )}
          </ul>
        </div>

        {/* Mailchimp Results */}
        <div className="mb-4 p-4 border-2 border-black bg-gray-50">
          <p className="text-sm font-semibold mb-2">Mailchimp Results:</p>
          <pre className="text-xs whitespace-pre-wrap">
            {results.mailchimpResults}
          </pre>
        </div>

        {/* Tito Failures */}
        {results.titoFailures.length > 0 && (
          <div className="mb-4 p-4 border-2 border-red-600 bg-red-50">
            <p className="text-sm font-bold text-red-600 mb-2">
              Tito Failures ({results.titoFailures.length}):
            </p>
            <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
              {results.titoFailures.slice(0, 20).map((failure, idx) => (
                <div key={idx} className="text-red-700">
                  {failure}
                </div>
              ))}
              {results.titoFailures.length > 20 && (
                <div className="text-red-700 font-semibold">
                  ...and {results.titoFailures.length - 20} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mailchimp Failures */}
        {results.mailchimpFailures.length > 0 && (
          <div className="mb-4 p-4 border-2 border-red-600 bg-red-50">
            <p className="text-sm font-bold text-red-600 mb-2">
              Mailchimp Failures:
            </p>
            <div className="text-xs space-y-1">
              {results.mailchimpFailures.map((failure, idx) => (
                <div key={idx} className="text-red-700">
                  {failure}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="special-button border-2 border-black px-4 py-2 text-xs font-medium uppercase bg-black text-white hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
