import { RichTextEditor } from './RichTextEditor';
import type { StrapiBlock } from './strapi-blocks';

export interface FormFieldProps {
  label: string;
  name: string;
  type: 'text' | 'textarea' | 'richtext' | 'datetime' | 'select';
  required?: boolean;
  maxLength?: number;
  error?: string;
  value: string | StrapiBlock[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export function FormField({
  label,
  name,
  type,
  required,
  maxLength,
  error,
  value,
  onChange,
  options,
  placeholder,
}: FormFieldProps) {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;

  function renderInput() {
    const baseInputStyle: React.CSSProperties = {
      ...styles.input,
      ...(error ? styles.inputError : {}),
    };

    // For non-richtext types, value is always a string
    const stringValue = value as string;

    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={inputId}
            name={name}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            maxLength={maxLength}
            placeholder={placeholder}
            style={{ ...baseInputStyle, ...styles.textarea }}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case 'richtext':
        return (
          <RichTextEditor
            value={value as StrapiBlock[] | string}
            onChange={(blocks) => onChange(blocks)}
            placeholder={placeholder}
            error={!!error}
          />
        );

      case 'datetime':
        return (
          <input
            id={inputId}
            name={name}
            type="datetime-local"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder={placeholder}
            style={baseInputStyle}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case 'select':
        return (
          <select
            id={inputId}
            name={name}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            style={baseInputStyle}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'text':
      default:
        return (
          <input
            id={inputId}
            name={name}
            type="text"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            maxLength={maxLength}
            placeholder={placeholder}
            style={baseInputStyle}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        );
    }
  }

  return (
    <div style={styles.fieldWrapper}>
      <label htmlFor={inputId} style={styles.label}>
        {label}
        {required && <span style={styles.requiredMark}> *</span>}
      </label>
      {renderInput()}
      {error && (
        <span id={errorId} role="alert" style={styles.errorText}>
          {error}
        </span>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px',
  },
  requiredMark: {
    color: '#dc2626',
  },
  input: {
    minHeight: '44px',
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  textarea: {
    minHeight: '100px',
    resize: 'vertical',
  },
  richtext: {
    minHeight: '200px',
    resize: 'vertical',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '14px',
    marginTop: '4px',
  },
};
