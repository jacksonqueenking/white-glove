# Form Components

This directory contains reusable form components with built-in validation, error handling, and orchestrator-generated form rendering.

## Components

### FormInput

Text input with label, error states, and helper text.

```tsx
import { FormInput } from '@/components/forms/FormInput';

<FormInput
  label="Email Address"
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helperText="We'll never share your email"
  placeholder="you@example.com"
/>
```

**Props:**
- `label: string` - Input label (required)
- `error?: string` - Error message to display
- `helperText?: string` - Helper text below input
- All standard HTML input attributes

### FormTextarea

Multi-line text input with the same features as FormInput.

```tsx
import { FormTextarea } from '@/components/forms/FormTextarea';

<FormTextarea
  label="Description"
  required
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  error={errors.description}
  rows={5}
  placeholder="Describe your business..."
/>
```

**Props:**
- `label: string` - Textarea label (required)
- `error?: string` - Error message to display
- `helperText?: string` - Helper text below textarea
- All standard HTML textarea attributes

### FormSelect

Dropdown select with options.

```tsx
import { FormSelect } from '@/components/forms/FormSelect';

<FormSelect
  label="Category"
  required
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  error={errors.category}
  options={[
    { value: 'catering', label: 'Catering' },
    { value: 'florals', label: 'Florals' },
    { value: 'photography', label: 'Photography' },
  ]}
/>
```

**Props:**
- `label: string` - Select label (required)
- `options: Array<{ value: string; label: string }>` - Options array (required)
- `error?: string` - Error message to display
- `helperText?: string` - Helper text below select
- All standard HTML select attributes

### MultiStepWizard

Multi-step form wizard with progress tracking and navigation.

```tsx
import { MultiStepWizard } from '@/components/forms/MultiStepWizard';

const steps = [
  {
    title: 'Basic Info',
    description: 'Tell us about yourself',
    content: <YourStepComponent />,
  },
  {
    title: 'Contact Details',
    description: 'How can we reach you?',
    content: <ContactStepComponent />,
  },
];

<MultiStepWizard
  steps={steps}
  onComplete={() => handleSubmit()}
  onStepChange={(step) => console.log('Current step:', step)}
/>
```

**Props:**
- `steps: Step[]` - Array of step objects (required)
  - Each step has: `title`, `description` (optional), `content` (React node)
- `onComplete: () => void` - Called when wizard is completed (required)
- `onStepChange?: (step: number) => void` - Called when step changes
- `currentStep?: number` - Control step externally (optional)

**Features:**
- Visual progress indicators
- Click to navigate to previous steps
- Disabled future steps until reached
- "Back" and "Continue" buttons
- Last step shows "Complete" button
- Completed steps show checkmark

### DynamicFormRenderer

Renders forms dynamically based on orchestrator-generated schemas (used for AI-generated forms).

```tsx
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';

<DynamicFormRenderer
  title="Custom Form"
  description="Please fill out this information"
  fields={[
    { id: 'name', label: 'Full Name', type: 'text', required: true },
    { id: 'notes', label: 'Notes', type: 'textarea', required: false },
  ]}
/>
```

## Styling

All components use Tailwind CSS and follow the platform's design system:

- Primary color: `slate-900`
- Error color: `red-500`
- Success color: `green-500`
- Border color: `slate-300`
- Focus ring: `slate-500`

## Validation

Form components handle their own visual validation states, but you need to provide:

1. Error messages via the `error` prop
2. Validation logic in your parent component

Example:
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};

  if (!email) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    newErrors.email = 'Please enter a valid email';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Accessibility

All form components include:

- Proper label associations
- Required field indicators (red asterisk)
- Error announcements via aria attributes
- Keyboard navigation support
- Focus management
