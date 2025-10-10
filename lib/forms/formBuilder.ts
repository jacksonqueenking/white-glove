interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
}

interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}

// Helpers for orchestrator-generated forms.
export function buildFormSchema(input: Partial<FormSchema>): FormSchema {
  return {
    title: input.title ?? "Untitled Form",
    description: input.description,
    fields: input.fields ?? [],
  };
}
