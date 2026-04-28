import { useField } from 'formik';

/**
 * Reusable FormField component
 * Props:
 *   name         - field key in Formik state
 *   label        - display label
 *   type         - input type (text, email, tel, etc.) or "select" or "textarea"
 *   placeholder  - input placeholder
 *   validator    - preset validator type: "email" | "phone" | "required"
 *   errorMessage - custom error message (overrides default)
 *   options      - array of {value, label} for select type
 *   submitCount  - from Formik, controls when errors are visible
 *   icon         - optional JSX icon element
 */
export default function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  options = [],
  submitCount,
  icon,
}) {
  const [field, meta] = useField(name);

  // Errors only show after first submit attempt, then live-update as user corrects
  const showError = submitCount > 0 && meta.touched && meta.error;

  const inputClass = `form-input${showError ? ' error' : ''}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={name} className="field-label">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none z-10">
            {icon}
          </span>
        )}

        {type === 'select' ? (
          <select
            id={name}
            {...field}
            className={inputClass}
            style={{
              paddingLeft: icon ? '2.75rem' : undefined,
              appearance: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={name}
            {...field}
            placeholder={placeholder}
            rows={3}
            className={inputClass}
            style={{
              resize: 'none',
              paddingLeft: icon ? '2.75rem' : undefined,
            }}
          />
        ) : (
          <input
            id={name}
            type={type}
            {...field}
            placeholder={placeholder}
            className={inputClass}
            style={{ paddingLeft: icon ? '2.75rem' : undefined }}
          />
        )}

        {/* Dropdown arrow for select */}
        {type === 'select' && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
      </div>

      {showError && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
            <circle cx="6" cy="6" r="5.5" stroke="#ff4d6d" />
            <path d="M6 3.5V6.5M6 8H6.005" stroke="#ff4d6d" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ color: 'var(--error)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            {meta.error}
          </span>
        </div>
      )}
    </div>
  );
}
