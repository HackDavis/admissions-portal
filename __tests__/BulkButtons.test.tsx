/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TentativelyAcceptedSelectedButton } from '../app/(pages)/admin/_components/BulkButtons';
import { Application } from '../app/_types/application';

it('preserves the waitlist acceptance path when accepting a mixed selection', () => {
  const onUpdateStatus = jest.fn();
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
  fireEvent.click(screen.getByRole('button', { name: 'u sure?' }));

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
