'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/shared/Button';

interface Step {
  title: string;
  description?: string;
  content: ReactNode;
}

interface MultiStepWizardProps {
  steps: Step[];
  onComplete: () => void;
  onStepChange?: (step: number) => void;
  currentStep?: number;
}

export function MultiStepWizard({
  steps,
  onComplete,
  onStepChange,
  currentStep: controlledStep
}: MultiStepWizardProps) {
  const [internalStep, setInternalStep] = useState(0);
  const currentStep = controlledStep ?? internalStep;

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      const nextStep = currentStep + 1;
      setInternalStep(nextStep);
      onStepChange?.(nextStep);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setInternalStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setInternalStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={index > currentStep}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition ${
                  index < currentStep
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                    : index === currentStep
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition ${
                    index < currentStep ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep].title}</h2>
          {steps[currentStep].description && (
            <p className="text-sm text-slate-600 mt-1">{steps[currentStep].description}</p>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">{steps[currentStep].content}</div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={isFirstStep}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </Button>
        <div className="text-sm text-slate-600">
          Step {currentStep + 1} of {steps.length}
        </div>
        <Button type="button" onClick={handleNext}>
          {isLastStep ? 'Complete' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
