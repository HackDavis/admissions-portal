import { useEffect, useRef } from 'react';

export function useEnterKey(handleNext: () => void, isActive: boolean) {
  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;

  useEffect(() => {
    if (!isActive) return;
    let enabled = false;
    const timer = setTimeout(() => {
      enabled = true;
    }, 300);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && enabled) {
        e.preventDefault();
        handleNextRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isActive]);
}
