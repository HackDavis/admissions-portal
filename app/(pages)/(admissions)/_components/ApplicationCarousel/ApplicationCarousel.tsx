'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoHeight from 'embla-carousel-auto-height';
import Confetti from 'react-confetti';

import { ApplicationFrame } from './ApplicationFrame';
import { useSubmitApplication } from '../../_hooks/useSubmitApplication';
import { IoChevronBackOutline } from 'react-icons/io5';
import { GoPerson } from 'react-icons/go';

import Email from './slides/Email';
import Contact from './slides/Contact';
import FinalStretch from './slides/FinalStretch';
import Diversity from './slides/Diversity';
import KeepGoing from './slides/KeepGoing';
import NearlySet from './slides/NearlySet';
import Confirmation from './slides/Confirmation';
import ABitMore from './slides/ABitMore';
import MLH from './slides/MLH';
import { NoteBanner } from './_components/NoteBanner';
import FutureHacker from './slides/FutureHacker';

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

  // Confetti: window dimensions
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Default form data (what user sees in application portal)
  const [formData, setFormData] = React.useState({
    //Email.tsx
    email: '',
    //Contact.tsx
    firstName: '',
    lastName: '',
    phone: '',
    //FutureHacker.tsx
    age: 0,
    isOver18: null,
    isUCDavisStudent: null,
    university: '',
    countryOfResidence: '',
    //KeepGoing.tsx
    levelOfStudy: '',
    major: '',
    minorOrDoubleMajor: '',
    college: [] as string[],
    //NearlySet.tsx
    year: 0,
    shirtSize: '',
    dietaryRestrictions: [] as string[],
    connectWithSponsors: null,
    //Diversity.tsx
    gender: [] as string[],
    race: [] as string[],
    attendedHackDavis: null,
    firstHackathon: null,
    //ABitMore.tsx
    linkedin: '',
    githubOrPortfolio: '',
    resume: '',
    //FinalStretch.tsx
    connectWithHackDavis: null,
    connectWithMLH: null,
    mlhAgreements: {
      mlhCodeOfConduct: null,
      eventLogisticsInformation: null,
    },
    // Admission status tracking
    status: 'pending',
    wasWaitlisted: false,
    customUniversity: '', //for custom university
  });

  // console.log('All form fields:', formData);

  const { submit } = useSubmitApplication();

  const handleFinalSubmit = async () => {
    //modify payload to account for custom university
    try {
      const { customUniversity, ...rest } = formData; // remove customUniversity from formData
      const payload = {
        ...rest,
        university:
          formData.university === 'Other'
            ? customUniversity
            : formData.university,
        status: formData.isOver18 ? 'pending' : 'tentatively_rejected',
      };
      //submit application
      const ok = await submit(payload);
      if (ok) {
        api?.scrollNext(); // move to confirmation page
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      console.error('Error submitting application: ', err);
      throw new Error('Submission failed');
    }
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
      key: 'future-hacker',
      node: (
        <FutureHacker
          formData={formData}
          setFormData={setFormData}
          onNext={() => api?.scrollNext()}
        />
      ),
    },
    {
      key: 'keep-going',
      node: (
        <KeepGoing
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
      key: 'a-bit-more',
      node: (
        <ABitMore
          formData={formData}
          setFormData={setFormData}
          onNext={() => api?.scrollNext()}
        />
      ),
    },
    {
      key: 'final-stretch',
      node: (
        <FinalStretch
          formData={formData}
          setFormData={setFormData}
          onNext={() => api?.scrollNext()}
        />
      ),
    },
    {
      key: 'mlh',
      node: (
        <MLH
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

  // for back/next buttons (for dev)
  const total = SLIDES.length;
  const canPrev = index > 0;
  const canNext = index < total - 1;

  // for top banner helper function
  const currentKey = SLIDES[index]?.key;

  const showTopBanner = currentKey === 'email';
  const showBottomBanner =
    currentKey === 'mlh' || currentKey === 'confirmation';

  const isConfirmation = currentKey === 'confirmation';

  const bannerEmoji =
    currentKey === 'confirmation'
      ? '/Images/YellowNotif.svg'
      : '/Images/RedNotif.svg';

  const bannerContent = (() => {
    switch (currentKey) {
      case 'email':
        return {
          bold: 'Each applicant may submit one application per email address. ',
          message:
            'We track applications by email to ensure a fair review process, so multiple submissions from the same email will not be accepted.',
        };
      case 'mlh':
        return {
          bold: 'NOTE: Only one email can be tied to one application. ',
          message:
            'We track applications by email to ensure a fair review process, so multiple submissions from the same email will not be accepted.',
        };
      case 'confirmation':
        return {
          bold: 'If you made a mistake or need to update your application after submitting, ',
          message:
            'please contact us at hello@hackdavis.io and we’ll be happy to help.',
        };
      default:
        return null;
    }
  })();

  return (
    <>
      {/* Confetti overlay on Confirmation page */}
      {isConfirmation && dimensions.width > 0 && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          numberOfPieces={400}
          recycle={false}
          gravity={0.25}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 50,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* back/next buttons (for dev) */}
      <div className="mt-8 px-[5%] flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          disabled={!canPrev}
          className="box-border rounded-full ring-2 ring-[#88D8DD] bg-[#9EE7E5] px-3 py-3 text-sm font-semibold text-white disabled:opacity-40 "
        >
          <IoChevronBackOutline
            width={50}
            height={50}
            className="text-[#005271] h-7 w-7"
          />
        </button>

        <button
          type="button"
          onClick={() => api?.scrollNext()}
          disabled={!canNext}
          className="rounded-full bg-[#E5EEF1] px-3 py-3 ring-2 ring-[#A6BFC7] disabled:opacity-40"
        >
          <GoPerson
            width={150}
            height={150}
            className="text-[#005271] h-7 w-7"
          />
        </button>
      </div>

      {/* note banner */}
      {showTopBanner && bannerContent && (
        <NoteBanner
          emoji={bannerEmoji}
          bold={bannerContent.bold}
          message={bannerContent.message}
        />
      )}

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
      >
        <div ref={viewportRef} className="overflow-hidden">
          <div className="flex items-start">
            {SLIDES.map((s) => (
              <div key={s.key} className="min-w-0 flex-[0_0_100%]">
                <div className="h-auto">{s.node}</div>
              </div>
            ))}
          </div>
        </div>
      </ApplicationFrame>

      {/* Bottom banner only on Last Page + Confirmation */}
      {showBottomBanner && bannerContent && (
        <div className="mt-4 mb-44">
          <NoteBanner
            emoji={bannerEmoji}
            bold={bannerContent.bold}
            message={bannerContent.message}
          />
        </div>
      )}
    </>
  );
}
