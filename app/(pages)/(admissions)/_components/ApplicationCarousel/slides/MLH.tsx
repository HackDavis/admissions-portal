'use client';

import React from 'react';
import { useEffect } from 'react';
import { YesNoGroup } from '../_components/YesNoGroup';
import { fetchUniversityNames } from '@utils/fetch/fetchUniversityNames';

interface MLHProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function MLH({
  formData,
  setFormData,
  onNext,
}: MLHProps) {
  const [universities, setUniversities] = React.useState<string[]>([]);
  useEffect(() => {
    fetchUniversityNames().then((data) => setUniversities(data));
  }, []);
  const uniqueUniversities = Array.from(new Set(universities));

  useEffect(() => {
    if (formData.isUCDavisStudent === true) {
      setFormData((prev: any) => ({
        ...prev,
        university: 'University of California, Davis',
      }));
    }
  }, [formData.isUCDavisStudent, setFormData]);


  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          MLH You're almost there, <br/> last page!
        </h1>

        <div className="mt-12 text-left space-y-10">
          <div>
            <h6 className="text-base font-semibold text-[#0F2530]">
              Please check the boxes that you agree to the following*
            </h6>

            <p>MLH Code of Conduct: "I have read and agree to the MLH Code of Conduct."</p>

            <p>Event Logistics Information: "I authorize you to share my application/registration information with Major League Hacking for event administration, ranking, and MLH administration in-line with the MLH Privacy Policy. I further agree to the terms of both the MLH Contest Terms and Conditions and the MLH Privacy Policy."</p>

            <YesNoGroup
              value={formData.isOver18}
              onChange={(v) => setFormData({ ...formData, isOver18: v })}
            />
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="button"
            className="flex items-center gap-3 rounded-full bg-[#005271] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95"
          >
            Next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
