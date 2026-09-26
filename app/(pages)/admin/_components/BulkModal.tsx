import { Application } from '@/app/_types/application';

interface BulkModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  action: string;
  results: Application[]; // Replace 'any' with the actual type of your results
  failures: { applicant: Application; error: string }[];
  onClose?: () => void; // Optional callback for closing the modal
}

export default function BulkModal({
  isOpen,
  isProcessing,
  action,
  results,
  failures,
  onClose,
}: BulkModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-black shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {isProcessing && <p role="status">Updating applicants...</p>}
        {!isProcessing && (
          <>
            {action === 'accept' && results.length > 0 && (
              <p>
                Successfully tentatively accepted {results.length} applicants.
              </p>
            )}
            {action === 'waitlist' && results.length > 0 && (
              <p>
                Successfully tentatively waitlisted {results.length} applicants.
              </p>
            )}
            {action === 'undo' && results.length > 0 && (
              <p>Successfully undid changes for {results.length} applicants.</p>
            )}
            <div className="mt-4 list-disc list-inside">
              {results.map((applicant: Application) => (
                <div key={applicant._id} className="text-xs">
                  {applicant.firstName} {applicant.lastName}
                </div>
              ))}
            </div>
            {failures.length > 0 && (
              <div role="alert" className="mt-4 text-red-800">
                <p>Failed to update {failures.length} applicants.</p>
                {failures.map(({ applicant, error }) => (
                  <p key={applicant._id} className="text-xs">
                    {applicant.firstName} {applicant.lastName} (
                    {applicant.email ?? applicant._id}): {error}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
        <div className="flex justify-end">
          <button
            disabled={isProcessing}
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
