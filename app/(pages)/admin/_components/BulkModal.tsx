import { Application } from '@/app/_types/application';

interface BulkModalProps {
  isOpen: boolean;
  action: string;
  results: Application[]; // Replace 'any' with the actual type of your results
  onClose?: () => void; // Optional callback for closing the modal
}

export default function BulkModal({
  isOpen,
  action,
  results,
  onClose,
}: BulkModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-black shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {action === 'accept' && (
          <p>Successfully tentatively accepted {results.length} applicants.</p>
        )}
        {action === 'waitlist' && (
          <p>
            Successfully tentatively waitlisted {results.length} applicants.
          </p>
        )}
        {action === 'undo' && (
          <p>Successfully undid changes for {results.length} applicants.</p>
        )}
        <div className="mt-4 list-disc list-inside">
          {results.map((applicant: Application) => (
            <div key={applicant._id} className="text-xs">
              {applicant.firstName} {applicant.lastName}
            </div>
          ))}
        </div>
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
