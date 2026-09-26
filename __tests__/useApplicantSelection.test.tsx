/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import useApplicantSelection from '../app/(pages)/admin/_hooks/useApplicantSelection';
import { Application } from '../app/_types/application';

const pending = { _id: 'pending', status: 'pending' } as Application;
const waitlisted = { _id: 'waitlisted', status: 'waitlisted' } as Application;
const initialProps = {
  apps: [pending, waitlisted],
  loading: false,
  filter: 'all',
};

function setup() {
  const hook = renderHook(
    ({ apps, loading, filter }) => useApplicantSelection(apps, loading, filter),
    { initialProps }
  );
  act(() => hook.result.current[1]([pending, waitlisted]));
  return hook;
}

it('removes hidden applicants and does not reselect them when they return', () => {
  const { result, rerender } = setup();
  rerender({ ...initialProps, apps: [waitlisted] });
  expect(result.current[0]).toEqual([waitlisted]);
  rerender(initialProps);
  expect(result.current[0]).toEqual([waitlisted]);
});

it('drops changed statuses and uses the latest data for retained applicants', () => {
  const { result, rerender } = setup();
  const updated = { ...waitlisted, firstName: 'Updated' };
  rerender({
    ...initialProps,
    apps: [{ ...pending, status: 'tentatively_accepted' }, updated],
  });
  expect(result.current[0]).toEqual([updated]);
  expect(result.current[0][0]).toBe(updated);
});

it('clears selection when the status filter changes before results arrive', () => {
  const { result, rerender } = setup();
  rerender({ ...initialProps, filter: 'pending' });
  expect(result.current[0]).toEqual([]);
});

it('clears selection during reloads, including global filter changes', () => {
  const { result, rerender } = setup();
  rerender({ ...initialProps, loading: true });
  expect(result.current[0]).toEqual([]);
  rerender(initialProps);
  expect(result.current[0]).toEqual([]);
});
