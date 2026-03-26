'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';
import cn from 'classnames';

export type StepItem = {
  key: string;
  label: string;
  description?: string;
};

type StepperProps = {
  steps: StepItem[];
  currentStep: number;
  className?: string;
};

export default function Stepper({ steps, currentStep, className }: StepperProps) {
  const { t } = useTranslation();
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          return (
            <li
              key={step.key}
              className={cn(
                'flex flex-1 items-center transition-smooth',
                index < steps.length - 1 ? 'after:content-[""] after:flex-1 after:border-b after:border-gray-200 after:mx-2' : ''
              )}
            >
              <div className="flex flex-col items-center flex-1">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-semibold text-sm transition-smooth',
                    isCompleted && 'border-accent bg-accent text-white',
                    isActive && 'border-accent bg-white text-accent ring-4 ring-accent/20',
                    !isActive && !isCompleted && 'border-gray-200 bg-white text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center sm:text-sm',
                    isActive ? 'text-accent' : isCompleted ? 'text-heading' : 'text-muted'
                  )}
                >
                  {typeof step.label === 'string' && step.label.startsWith('form:') ? t(step.label) : step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
