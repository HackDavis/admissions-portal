/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import PhaseColumn from '../app/(pages)/admin/_components/PhaseColumn';
import { Application } from '../app/_types/application';

const applicant = {
  _id: 'one',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  status: 'pending',
} as Application;

it('labels selectable applicants and removes checkboxes from processed cards', () => {
  const props = {
    apps: [applicant],
    isLoading: false,
    label: 'Applications',
    selectedApplicants: [],
    setSelectedApplicants: jest.fn(),
  };
  const { rerender } = render(<PhaseColumn {...props} phase="unseen" />);
  expect(
    screen.getByRole('checkbox', {
      name: 'Select Ada Lovelace (ada@example.com)',
    })
  ).toBeInTheDocument();
  rerender(<PhaseColumn {...props} phase="tentative" />);
  expect(
    screen.getByRole('checkbox', {
      name: 'Select Ada Lovelace (ada@example.com)',
    })
  ).toBeInTheDocument();
  rerender(<PhaseColumn {...props} phase="processed" />);
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getByText('email: ada@example.com')).toBeInTheDocument();
});
