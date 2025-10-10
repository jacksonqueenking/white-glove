type FieldType = "text" | "textarea" | "select" | "multiselect" | "number" | "date" | "checkbox";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
}

interface DynamicFormRendererProps {
  title: string;
  description?: string;
  fields: FormField[];
}

// Render orchestrator-generated forms on tasks and requests.
export function DynamicFormRenderer({ title, description, fields }: DynamicFormRendererProps) {
  return (
    <form className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </header>
      {fields.map((field) => (
        <label key={field.id} className="block text-sm font-medium text-slate-700">
          {field.label}
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required={field.required}
            placeholder={`Field type: ${field.type}`}
            readOnly
          />
        </label>
      ))}
      <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Submit
      </button>
    </form>
  );
}
