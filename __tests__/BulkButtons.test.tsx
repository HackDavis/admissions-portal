/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  SelectAllButton,
  TentativelyWaitlistedSelectedButton,
  UndoSelectedButton,
  TentativelyAcceptedSelectedButton,
} from '../app/(pages)/admin/_components/BulkButtons';
import { Application } from '../app/_types/application';

it('compares applicant IDs instead of counts when toggling select all', () => {
  const apps = [{ _id: 'visible' }] as Application[];
  const setSelectedApplicants = jest.fn();
  const { rerender } = render(
    <SelectAllButton
      apps={apps}
      selectedApplicants={[{ _id: 'hidden' }] as Application[]}
      setSelectedApplicants={setSelectedApplicants}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'select all' }));
  expect(setSelectedApplicants).toHaveBeenLastCalledWith(apps);
  rerender(
    <SelectAllButton
      apps={apps}
      selectedApplicants={apps}
      setSelectedApplicants={setSelectedApplicants}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'deselect all' }));
  expect(setSelectedApplicants).toHaveBeenLastCalledWith([]);
});

it('preserves the waitlist acceptance path when accepting a mixed selection', async () => {
  const onUpdateStatus = jest.fn().mockResolvedValue({ ok: true });
  const selectedApplicants = [
    { _id: 'pending-app', status: 'pending', wasWaitlisted: false },
    { _id: 'waitlisted-app', status: 'waitlisted', wasWaitlisted: true },
  ] as Application[];

  render(
    <TentativelyAcceptedSelectedButton
      selectedApplicants={selectedApplicants}
      onUpdateStatus={onUpdateStatus}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'accept selected' }));
  expect(onUpdateStatus).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'u sure?' }));
  });

  expect(onUpdateStatus).toHaveBeenCalledTimes(2);
  expect(onUpdateStatus).toHaveBeenCalledWith(
    'pending-app',
    'tentatively_accepted',
    'unseen',
    { refreshPhase: 'tentative' }
  );
  expect(onUpdateStatus).toHaveBeenCalledWith(
    'waitlisted-app',
    'tentatively_waitlist_accepted',
    'unseen',
    { refreshPhase: 'tentative' }
  );
});

it.each([
  ['accept', TentativelyAcceptedSelectedButton],
  ['waitlist', TentativelyWaitlistedSelectedButton],
  ['undo', UndoSelectedButton],
] as const)(
  'waits for %s updates and reports partial failures',
  async (action, Button) => {
    let finish!: (result: { ok: true }) => void;
    const pending = new Promise<{ ok: true }>((resolve) => {
      finish = resolve;
    });
    const onUpdateStatus = jest
      .fn()
      .mockReturnValueOnce(pending)
      .mockResolvedValueOnce({ ok: false, error: 'Database unavailable' })
      .mockRejectedValueOnce(new Error('Connection lost'));
    const applicants = [
      { _id: 'one', firstName: 'Success', status: 'pending' },
      { _id: 'two', firstName: 'Failure', status: 'pending' },
      { _id: 'three', firstName: 'Rejected', status: 'pending' },
    ] as Application[];
    render(
      <Button selectedApplicants={applicants} onUpdateStatus={onUpdateStatus} />
    );
    fireEvent.click(screen.getByRole('button', { name: `${action} selected` }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'u sure?' }));
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Updating applicants...'
    );
    expect(screen.queryByText(/Successfully/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'processing...' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'processing...' }));
    expect(onUpdateStatus).toHaveBeenCalledTimes(3);
    await act(async () => {
      finish({ ok: true });
    });
    expect(screen.getByText(/Successfully/)).toHaveTextContent('1 applicants');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to update 2 applicants'
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Database unavailable');
    expect(screen.getByRole('alert')).toHaveTextContent('Connection lost');
    expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
  }
);

it.each([
  ['accept', TentativelyAcceptedSelectedButton],
  ['waitlist', TentativelyWaitlistedSelectedButton],
  ['undo', UndoSelectedButton],
] as const)(
  'resets %s confirmation when selection changes',
  (action, Button) => {
    const onUpdateStatus = jest.fn();
    const first = { _id: 'first', status: 'pending' } as Application;
    const second = { _id: 'second', status: 'pending' } as Application;
    const { rerender } = render(
      <Button selectedApplicants={[first]} onUpdateStatus={onUpdateStatus} />
    );
    fireEvent.click(screen.getByRole('button', { name: `${action} selected` }));
    expect(screen.getByRole('button', { name: 'u sure?' })).toBeInTheDocument();
    rerender(
      <Button
        selectedApplicants={[{ ...first }]}
        onUpdateStatus={onUpdateStatus}
      />
    );
    expect(screen.getByRole('button', { name: 'u sure?' })).toBeInTheDocument();
    rerender(
      <Button selectedApplicants={[second]} onUpdateStatus={onUpdateStatus} />
    );
    fireEvent.click(screen.getByRole('button', { name: `${action} selected` }));
    expect(onUpdateStatus).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'u sure?' })).toBeInTheDocument();
  }
);
