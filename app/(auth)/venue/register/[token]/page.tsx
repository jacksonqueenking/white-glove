'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MultiStepWizard } from '@/components/forms/MultiStepWizard';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSelect } from '@/components/forms/FormSelect';
import { Button } from '@/components/shared/Button';

interface VenueFormData {
  // Step 1: Basic Info
  name: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;

  // Step 2: Location & Details
  street: string;
  city: string;
  state: string;
  zip: string;
  description: string;

  // Step 3: Spaces
  spaces: Array<{
    name: string;
    description: string;
    capacity: number;
    main_image_url: string;
  }>;

  // Step 4: Offerings
  offerings: Array<{
    name: string;
    category: string;
    price: number;
    description: string;
    lead_time_days: number;
  }>;
}

const initialFormData: VenueFormData = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  description: '',
  spaces: [],
  offerings: [],
};

export default function VenueRegisterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState<VenueFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (updates: Partial<VenueFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Venue name must be at least 3 characters';
    }
    if (!formData.contactName) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.street) newErrors.street = 'Street address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state || formData.state.length !== 2) {
      newErrors.state = 'Valid 2-letter state code required';
    }
    if (!formData.zip || !/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip = 'Valid ZIP code required';
    }
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (formData.spaces.length === 0) {
      alert('Please add at least one space');
      return;
    }
    if (formData.offerings.length < 3) {
      alert('Please add at least 3 offerings');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          phone: formData.phone,
          contactName: formData.contactName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          description: formData.description,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // Now create spaces and offerings
      // Note: You'll need to add API routes for these
      router.push(result.redirect || '/venue/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Basic Information',
      description: 'Tell us about your venue',
      content: (
        <div className="space-y-4">
          <FormInput
            label="Venue Name"
            required
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            error={errors.name}
            placeholder="The Grand Ballroom"
          />
          <FormInput
            label="Contact Name"
            required
            value={formData.contactName}
            onChange={(e) => updateFormData({ contactName: e.target.value })}
            error={errors.contactName}
            placeholder="John Smith"
          />
          <FormInput
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            error={errors.email}
            placeholder="contact@venue.com"
          />
          <FormInput
            label="Phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            error={errors.phone}
            placeholder="(555) 123-4567"
          />
          <FormInput
            label="Password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => updateFormData({ password: e.target.value })}
            error={errors.password}
            helperText="At least 8 characters, including uppercase, lowercase, number, and special character"
          />
          <FormInput
            label="Confirm Password"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />
        </div>
      ),
    },
    {
      title: 'Location & Details',
      description: 'Where is your venue located?',
      content: (
        <div className="space-y-4">
          <FormInput
            label="Street Address"
            required
            value={formData.street}
            onChange={(e) => updateFormData({ street: e.target.value })}
            error={errors.street}
            placeholder="123 Main Street"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="City"
              required
              value={formData.city}
              onChange={(e) => updateFormData({ city: e.target.value })}
              error={errors.city}
              placeholder="San Francisco"
            />
            <FormInput
              label="State"
              required
              value={formData.state}
              onChange={(e) => updateFormData({ state: e.target.value.toUpperCase() })}
              error={errors.state}
              placeholder="CA"
              maxLength={2}
            />
          </div>
          <FormInput
            label="ZIP Code"
            required
            value={formData.zip}
            onChange={(e) => updateFormData({ zip: e.target.value })}
            error={errors.zip}
            placeholder="94102"
          />
          <FormTextarea
            label="Venue Description"
            required
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            error={errors.description}
            placeholder="Describe your venue, its atmosphere, unique features, and what makes it special..."
            rows={5}
          />
        </div>
      ),
    },
    {
      title: 'Add Spaces',
      description: 'Add at least one event space (you can add more later)',
      content: <SpacesStep formData={formData} updateFormData={updateFormData} />,
    },
    {
      title: 'Add Offerings',
      description: 'Add 3-5 services you provide in-house',
      content: <OfferingsStep formData={formData} updateFormData={updateFormData} />,
    },
    {
      title: 'Review & Submit',
      description: 'Review your information before submitting',
      content: <ReviewStep formData={formData} />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to EventPlatform</h1>
          <p className="text-slate-600 mt-2">Let's get your venue set up</p>
        </div>

        <MultiStepWizard steps={steps} onComplete={handleSubmit} />

        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
              <p className="text-slate-700">Creating your venue account...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Spaces Step Component
function SpacesStep({
  formData,
  updateFormData,
}: {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
}) {
  const [newSpace, setNewSpace] = useState({
    name: '',
    description: '',
    capacity: 0,
    main_image_url: '',
  });

  const addSpace = () => {
    if (!newSpace.name || !newSpace.description || newSpace.capacity <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    updateFormData({
      spaces: [...formData.spaces, newSpace],
    });

    setNewSpace({ name: '', description: '', capacity: 0, main_image_url: '' });
  };

  const removeSpace = (index: number) => {
    updateFormData({
      spaces: formData.spaces.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Added Spaces List */}
      {formData.spaces.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-slate-900">Added Spaces ({formData.spaces.length})</h3>
          {formData.spaces.map((space, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{space.name}</p>
                <p className="text-sm text-slate-600">Capacity: {space.capacity} guests</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeSpace(index)}
                className="text-red-600 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Space Form */}
      <div className="border border-slate-200 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-slate-900">Add a Space</h3>
        <FormInput
          label="Space Name"
          required
          value={newSpace.name}
          onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
          placeholder="Main Ballroom"
        />
        <FormTextarea
          label="Description"
          required
          value={newSpace.description}
          onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
          placeholder="Describe this space..."
          rows={3}
        />
        <FormInput
          label="Capacity"
          type="number"
          required
          value={newSpace.capacity || ''}
          onChange={(e) => setNewSpace({ ...newSpace, capacity: parseInt(e.target.value) || 0 })}
          placeholder="300"
        />
        <FormInput
          label="Main Image URL (optional)"
          value={newSpace.main_image_url}
          onChange={(e) => setNewSpace({ ...newSpace, main_image_url: e.target.value })}
          placeholder="https://..."
          helperText="You can upload photos later"
        />
        <Button type="button" onClick={addSpace} variant="secondary" className="w-full">
          + Add Space
        </Button>
      </div>

      {formData.spaces.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          ⚠️ You must add at least one space to continue
        </p>
      )}
    </div>
  );
}

// Offerings Step Component
function OfferingsStep({
  formData,
  updateFormData,
}: {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
}) {
  const [newOffering, setNewOffering] = useState({
    name: '',
    category: '',
    price: 0,
    description: '',
    lead_time_days: 0,
  });

  const categories = [
    { value: 'venue_rental', label: 'Venue Rental' },
    { value: 'tables_chairs', label: 'Tables & Chairs' },
    { value: 'linens', label: 'Linens & Décor' },
    { value: 'av_equipment', label: 'Audio/Visual Equipment' },
    { value: 'catering', label: 'Catering (in-house)' },
    { value: 'bar_service', label: 'Bar Service' },
    { value: 'coordination', label: 'Coordination Services' },
    { value: 'setup_cleanup', label: 'Setup/Cleanup' },
    { value: 'parking', label: 'Parking' },
    { value: 'other', label: 'Other' },
  ];

  const addOffering = () => {
    if (!newOffering.name || !newOffering.category || !newOffering.description || newOffering.price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    updateFormData({
      offerings: [...formData.offerings, newOffering],
    });

    setNewOffering({ name: '', category: '', price: 0, description: '', lead_time_days: 0 });
  };

  const removeOffering = (index: number) => {
    updateFormData({
      offerings: formData.offerings.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Added Offerings List */}
      {formData.offerings.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-slate-900">
            Added Offerings ({formData.offerings.length})
            {formData.offerings.length < 3 && (
              <span className="text-sm text-amber-600 ml-2">(Add at least 3)</span>
            )}
          </h3>
          {formData.offerings.map((offering, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{offering.name}</p>
                <p className="text-sm text-slate-600">
                  ${offering.price.toFixed(2)} • {categories.find((c) => c.value === offering.category)?.label}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeOffering(index)}
                className="text-red-600 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Offering Form */}
      <div className="border border-slate-200 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-slate-900">Add an Offering</h3>
        <FormInput
          label="Offering Name"
          required
          value={newOffering.name}
          onChange={(e) => setNewOffering({ ...newOffering, name: e.target.value })}
          placeholder="Premium AV Package"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Category"
            required
            value={newOffering.category}
            onChange={(e) => setNewOffering({ ...newOffering, category: e.target.value })}
            options={categories}
          />
          <FormInput
            label="Price"
            type="number"
            required
            value={newOffering.price || ''}
            onChange={(e) => setNewOffering({ ...newOffering, price: parseFloat(e.target.value) || 0 })}
            placeholder="2500.00"
          />
        </div>
        <FormTextarea
          label="Description"
          required
          value={newOffering.description}
          onChange={(e) => setNewOffering({ ...newOffering, description: e.target.value })}
          placeholder="Describe what's included..."
          rows={3}
        />
        <FormInput
          label="Lead Time (days notice required)"
          type="number"
          value={newOffering.lead_time_days || ''}
          onChange={(e) => setNewOffering({ ...newOffering, lead_time_days: parseInt(e.target.value) || 0 })}
          placeholder="7"
          helperText="Leave as 0 if no lead time required"
        />
        <Button type="button" onClick={addOffering} variant="secondary" className="w-full">
          + Add Offering
        </Button>
      </div>

      {formData.offerings.length < 3 && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          ⚠️ Please add at least 3 offerings to continue
        </p>
      )}
    </div>
  );
}

// Review Step Component
function ReviewStep({ formData }: { formData: VenueFormData }) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          ✓ Review your information below. Your profile will be submitted for approval and you'll hear back within
          1-2 business days.
        </p>
      </div>

      <div className="space-y-4">
        <Section title="Venue Information">
          <InfoRow label="Venue Name" value={formData.name} />
          <InfoRow label="Contact Name" value={formData.contactName} />
          <InfoRow label="Email" value={formData.email} />
          <InfoRow label="Phone" value={formData.phone} />
        </Section>

        <Section title="Location">
          <InfoRow label="Address" value={`${formData.street}, ${formData.city}, ${formData.state} ${formData.zip}`} />
          <InfoRow label="Description" value={formData.description} />
        </Section>

        <Section title="Spaces">
          {formData.spaces.map((space, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg mb-2">
              <p className="font-medium text-slate-900">{space.name}</p>
              <p className="text-sm text-slate-600">Capacity: {space.capacity} guests</p>
            </div>
          ))}
        </Section>

        <Section title="Offerings">
          {formData.offerings.map((offering, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg mb-2">
              <p className="font-medium text-slate-900">{offering.name}</p>
              <p className="text-sm text-slate-600">${offering.price.toFixed(2)}</p>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm text-slate-900 font-medium">{value}</span>
    </div>
  );
}
