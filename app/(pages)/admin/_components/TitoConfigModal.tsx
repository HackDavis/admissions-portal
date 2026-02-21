import { RsvpList, Release } from '@/app/_types/tito';

interface TitoConfigModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  loadingTitoData: boolean;
  rsvpLists: RsvpList[];
  releases: Release[];
  selectedRsvpList: string;
  selectedReleases: string[];
  onSelectRsvpList: (slug: string) => void;
  onToggleRelease: (id: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TitoConfigModal({
  isOpen,
  isProcessing,
  loadingTitoData,
  rsvpLists,
  releases,
  selectedRsvpList,
  selectedReleases,
  onSelectRsvpList,
  onToggleRelease,
  onCancel,
  onConfirm,
}: TitoConfigModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-black shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Finalize All Applicants</h2>

        {loadingTitoData ? (
          <div className="text-center py-8">
            <p className="text-sm">Loading Tito data...</p>
          </div>
        ) : (
          <>
            {/* RSVP List Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Select RSVP List:
              </label>
              {rsvpLists.length === 0 ? (
                <p className="text-xs text-gray-600">
                  No RSVP lists found. Create one in Tito first.
                </p>
              ) : (
                <select
                  value={selectedRsvpList}
                  onChange={(e) => onSelectRsvpList(e.target.value)}
                  className="w-full border-2 border-black px-3 py-2 text-xs"
                  disabled={isProcessing}
                >
                  <option value="">-- Select RSVP List --</option>
                  {rsvpLists.map((list) => (
                    <option key={list.slug} value={list.slug}>
                      {list.title} ({list.slug})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Release Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Select Release(s):
              </label>
              {releases.length === 0 ? (
                <p className="text-xs text-gray-600">
                  No releases found. Create releases in Tito first.
                </p>
              ) : (
                <div className="border-2 border-black p-3 max-h-60 overflow-y-auto">
                  {releases.map((release) => (
                    <label
                      key={release.id}
                      className="flex items-center space-x-2 mb-2 cursor-pointer hover:bg-gray-100 p-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReleases.includes(release.id)}
                        onChange={() => onToggleRelease(release.id)}
                        className="w-4 h-4"
                        disabled={isProcessing}
                      />
                      <span className="text-xs">
                        {release.title}
                        {release.quantity && ` (Qty: ${release.quantity})`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {selectedReleases.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {selectedReleases.length} release(s) selected
                </p>
              )}
            </div>

            {/* Info */}
            {!isProcessing && (
              <div className="mb-4 p-3 border-2 border-black bg-gray-50">
                <p className="text-xs font-semibold mb-1">
                  This single button will:
                </p>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li>Create Tito invitations for accepted applicants</li>
                  <li>Create Hub invitations for accepted applicants</li>
                  <li>Add applicant decision to Mailchimp dashboard</li>
                  <li>Update application statuses in database</li>
                  <li>Download CSV with all data and any errors</li>
                </ol>
              </div>
            )}

            {/* Processing Status - Warning */}
            {isProcessing && (
              <div className="mb-4 p-3 border-2 border-yellow-600 bg-yellow-50">
                <p className="text-xs font-bold text-yellow-800 mb-2">
                  IMPORTANT: DO NOT EXIT THIS PAGE UNTIL COMPLETE!
                </p>
                <p className="text-xs text-yellow-800">
                  The process will take several minutes. Wait for success or
                  error message.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={onCancel}
                className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase bg-black text-white hover:bg-gray-800"
                disabled={
                  isProcessing ||
                  !selectedRsvpList ||
                  selectedReleases.length === 0
                }
              >
                {isProcessing ? 'PROCESSING...' : 'PROCESS ALL'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
