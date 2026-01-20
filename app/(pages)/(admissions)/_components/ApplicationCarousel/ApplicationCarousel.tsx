'use client';

//TODO: ADD BACK BUTTON AND PROFILE THING
//TODO: handle submission failure (some kind of visual feedback)

import React from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import AutoHeight from 'embla-carousel-auto-height';

import { ApplicationFrame } from './ApplicationFrame';
import { useSubmitApplication } from '../../_hooks/useSubmitApplication';

import Email from './slides/Email';
import Contact from './slides/Contact';
import Diversity from './slides/Diversity';
import NearlySet from './slides/NearlySet';
import Confirmation from './slides/Confirmation';
import LastPage from './slides/LastPage';

type SlideDef = {
  key: string;
  node: React.ReactNode;
};

export default function ApplicationCarousel() {
  const [viewportRef, api] = useEmblaCarousel(
    {
      loop: false,
      align: 'start',
      skipSnaps: false,
      watchDrag: false,
    },
    [AutoHeight()]
  );

  const [index, setIndex] = React.useState(0);

  // Default form data (what user sees in application portal)
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: 0,
    isUCDavisStudent: false,
    isOver18: false,
    university: '',
    levelOfStudy: '',
    major: '',
    college: [] as string[],
    year: 0,
    shirtSize: '',
    dietaryRestrictions: [] as string[],
    connectWithSponsors: false,
    resume: '',
    linkedin: '',
    githubOrPortfolio: '',
    connectWithHackDavis: false,
    connectWithMLH: false,
    status: 'pending',
    wasWaitlisted: false,
    customUniversity: '', //for custom university
    gender: [] as string[],
    race: [] as string[],
    attendedHackDavis: false,
    firstHackathon: false,
  });

  // console.log('All form fields:', formData);

  const { submit } = useSubmitApplication();

  const handleFinalSubmit = async () => {
    //modify payload to account for custom university
    const { customUniversity, ...rest } = formData; // remove customUniversity from formData
    const payload = {
      ...rest,
      university:
        formData.university === 'Other'
          ? customUniversity
          : formData.university,
    };
    //submit application
    const ok = await submit(payload);
    if (ok) api?.scrollNext();

    //TODO: handle submission failure (some kind of visual feedback)
  };

  const SLIDES: SlideDef[] = [
    {
      key: 'email',
      node: (
        <Email
          formData={formData}
          setFormData={setFormData}
          onNext={() => api?.scrollNext()}
        />
      ),
    },
    {
      key: 'contact',
      node: (
        <Contact
          formData={formData}
          setFormData={setFormData}
          onNext={() => api?.scrollNext()}
        />
      ),
    },
    {
      key: 'nearly-set',
      node: (
        <NearlySet
          formData={formData}
          setFormData={setFormData}
          onNext={() => api?.scrollNext()}
        />
      ),
    },
    {
      key: 'diversity',
      node: (
        <Diversity
          formData={formData}
          setFormData={setFormData}
          onNext={() => api?.scrollNext()}
        />
      ),
    },
    {
      key: 'last-page',
      node: (
        <LastPage
          formData={formData}
          setFormData={setFormData}
          onNext={handleFinalSubmit}
        />
      ),
    },
    { key: 'confirmation', node: <Confirmation /> },
  ];

  React.useEffect(() => {
    if (!api) return;

    const update = () => setIndex(api.selectedScrollSnap());
    update();

    api.on('select', update);
    api.on('reInit', update);

    return () => {
      api.off('select', update);
      api.off('reInit', update);
    };
  }, [api]);

  // //for back/next buttons (for dev)
  // const total = SLIDES.length;
  // const canPrev = index > 0;
  // const canNext = index < total - 1;

  return (
    <ApplicationFrame
      topRight={
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => {
            const active = i === index;
            return (
              <div
                key={i}
                className={[
                  'h-2.5 rounded-full',
                  'border border-[#005271]',
                  'transition-all duration-300 ease-out',
                  active ? 'w-8 bg-[#9EE7E5]' : 'w-2.5 bg-[#005271]',
                ].join(' ')}
              />
            );
          })}
        </div>
      }
      leftDecor={
        index === 0 ? (
          <div
            className="
              pointer-events-none
              absolute
              left-32
              top-0
              hidden sm:block
              -translate-x-[61%]
              -translate-y-[17%]
              w-56 h-56
              md:w-64 md:h-64
              lg:w-80 lg:h-80
            "
          >
            <Image
              src="/Images/Peeping.svg"
              alt="Animals peering from behind a wall."
              fill
              className="object-contain"
              priority
            />
          </div>
        ) : null
      }
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex items-start">
          {SLIDES.map((s) => (
            <div key={s.key} className="min-w-0 flex-[0_0_100%]">
              <div className="px-2 sm:px-4 h-auto">{s.node}</div>
            </div>
          ))}
        </div>
      </div>

      {/* back/next buttons (for dev) */}
      {/* <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          disabled={!canPrev}
          className="rounded-full border-2 border-[#005271] px-5 py-2 text-sm font-semibold text-[#005271] disabled:opacity-40"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => api?.scrollNext()}
          disabled={!canNext}
          className="rounded-full bg-[#005271] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {canNext ? 'Next →' : 'Finish'}
        </button>
      </div> */}

      {/* <p className="mt-3 text-center text-xs text-[#173B47]/70">
        Step {index + 1} of {total}
      </p> */}
    </ApplicationFrame>
  );
}
