import { useEffect, useRef, useState, useCallback } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import FormField from './components/FormField';
import SidebarNav from './components/SidebarNav';
import ShimmerLoader from './components/ShimmerLoader';

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  dob: Yup.string().required('Date of birth is required'),
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .required('Phone number is required'),
  address: Yup.string().required('Address is required'),
  company: Yup.string().required('Company / Organisation is required'),
  role: Yup.string().required('Please select your role'),
  experience: Yup.string().required('Years of experience is required'),
  interest: Yup.string().required('Please select your area of interest'),
  timezone: Yup.string().required('Please select your timezone'),
  bio: Yup.string().min(20, 'Bio must be at least 20 characters').required('Short bio is required'),
});

const initialValues = {
  firstName: '', lastName: '', dob: '',
  email: '', phone: '', address: '',
  company: '', role: '', experience: '',
  interest: '', timezone: '', bio: '',
};

// ─── FormSection wrapper ──────────────────────────────────────────────────────
function FormSection({ id, letter, title, children, sectionRef, dataIndex }) {
  return (
    <section
      id={id}
      ref={sectionRef}
      data-index={dataIndex}
      className="section-animate"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '32px',
        marginBottom: 24,
        scrollMarginTop: '2rem',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--accent) 0%, #5c6aff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 16px var(--accent-glow)',
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: '#fff' }}>{letter}</span>
        </div>
        <div>
          <span className="section-tag">Section {letter}</span>
          <h2 className="section-heading mt-1">{title}</h2>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

// ─── Auto-trigger: fires onFormComplete when allFilled+isValid, re-fires on change ──
// Uses a ref to track the PREVIOUS valid state so we can detect transitions AND
// re-triggers on every render while valid (but NOT during/after submission).
function FormAutoTrigger({ allFilled, isValid, isSubmitting, isSubmitted, onFormComplete, children }) {
  const prevKey = useRef(null);

  useEffect(() => {
    // Do NOT trigger if the form has already been submitted successfully,
    // or if Formik is in the middle of submitting.
    if (isSubmitted || isSubmitting) return;

    if (allFilled && isValid) {
      onFormComplete();
    }
  // We intentionally omit stable refs from deps — this fires whenever
  // allFilled/isValid/isSubmitting/isSubmitted change, which is exactly
  // "re-trigger on every subsequent change while valid."
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFilled, isValid, isSubmitting, isSubmitted]);

  return children;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeSections, setActiveSections] = useState([]);
  const [showShimmer, setShowShimmer] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const scrollRef = useRef(null);
  const sectionRefs = useRef([]);
  const shimmerTimeout = useRef(null);

  // ── onFormComplete ─────────────────────────────────────────────────────────
  // Starts (or resets) the 3-second shimmer window.
  const onFormComplete = useCallback(() => {
    if (shimmerTimeout.current) clearTimeout(shimmerTimeout.current);
    setShowShimmer(true);
    shimmerTimeout.current = setTimeout(() => setShowShimmer(false), 3000);
  }, []);

  // ── Immediately dismiss shimmer when form is submitted ─────────────────────
  const handleSubmitSuccess = useCallback(() => {
    if (shimmerTimeout.current) clearTimeout(shimmerTimeout.current);
    setShowShimmer(false);   // close any open shimmer right away
    setSubmitSuccess(true);  // show the success banner
  }, []);

  // ── Scroll / IntersectionObserver ──────────────────────────────────────────
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.index, 10);
            setActiveSections((prev) =>
              prev.includes(idx) ? prev : [...prev, idx].sort((a, b) => a - b)
            );
          }
        });
      },
      { root: scrollEl, threshold: 0.2 }
    );
    sectionRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // ── Cleanup timeout on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => { if (shimmerTimeout.current) clearTimeout(shimmerTimeout.current); };
  }, []);

  const ROLE_OPTIONS = [
    { value: 'engineer', label: 'Software Engineer' },
    { value: 'designer', label: 'UI/UX Designer' },
    { value: 'pm', label: 'Product Manager' },
    { value: 'lead', label: 'Tech Lead' },
    { value: 'other', label: 'Other' },
  ];
  const EXP_OPTIONS = [
    { value: '0-1', label: '0 – 1 year' },
    { value: '1-3', label: '1 – 3 years' },
    { value: '3-5', label: '3 – 5 years' },
    { value: '5-10', label: '5 – 10 years' },
    { value: '10+', label: '10+ years' },
  ];
  const INTEREST_OPTIONS = [
    { value: 'frontend', label: 'Frontend Dev' },
    { value: 'backend', label: 'Backend Dev' },
    { value: 'fullstack', label: 'Full Stack' },
    { value: 'devops', label: 'DevOps' },
    { value: 'design', label: 'Design' },
  ];
  const TZ_OPTIONS = [
    { value: 'IST', label: 'IST (UTC+5:30)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'EST', label: 'EST (UTC-5)' },
    { value: 'PST', label: 'PST (UTC-8)' },
    { value: 'CET', label: 'CET (UTC+1)' },
  ];

  return (
    <>
      <div className="bg-mesh" />

      {/* Shimmer overlay — only visible when showShimmer=true AND form not yet submitted */}
      {showShimmer && !submitSuccess && <ShimmerLoader />}

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '2rem' }}>
        {/* Page header */}
        <header style={{ maxWidth: 1100, margin: '0 auto 2rem' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
                Frontend Assessment — Task 1
              </p>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                Multi-Section Form
              </h1>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 16px', fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Vima3ya
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border)', marginTop: '1.5rem' }} />
        </header>

        {/* Two-column layout */}
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
          <SidebarNav activeSections={activeSections} />

          {/* Scrollable form column */}
          <div
            ref={scrollRef}
            style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', paddingRight: 8, paddingBottom: 32 }}
          >
            {/* Success banner — shown after submit, replaces shimmer */}
            {submitSuccess && (
              <div
                className="success-banner flex items-center gap-3 mb-6 px-5 py-4 rounded-xl"
                style={{ background: 'rgba(0, 229, 180, 0.08)', border: '1px solid rgba(0, 229, 180, 0.3)' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="#00e5b4" strokeWidth="1.5"/>
                  <path d="M6.5 10L9 12.5L13.5 8" stroke="#00e5b4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: '#00e5b4' }}>
                  Form submitted successfully! All validations passed.
                </span>
              </div>
            )}

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              validateOnChange={true}
              validateOnBlur={true}
              onSubmit={(_values, actions) => {
                // 1. Immediately kill the shimmer and show success banner
                handleSubmitSuccess();
                actions.setSubmitting(false);
              }}
            >
              {({ values, errors, submitCount, isValid, isSubmitting }) => {
                const allFilled = Object.values(values).every((v) => String(v).trim() !== '');

                return (
                  <FormAutoTrigger
                    allFilled={allFilled}
                    isValid={isValid}
                    isSubmitting={isSubmitting}
                    isSubmitted={submitSuccess}  // once submitted, auto-trigger stops
                    onFormComplete={onFormComplete}
                  >
                    <Form noValidate>
                      {/* ── Section A ── */}
                      <FormSection id="section-a" letter="A" title="Personal Info"
                        sectionRef={(el) => (sectionRefs.current[0] = el)} dataIndex="0">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField name="firstName" label="First Name" placeholder="e.g. Arjun" submitCount={submitCount}
                            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 8C9.933 8 11.5 6.433 11.5 4.5S9.933 1 8 1 4.5 2.567 4.5 4.5 6.067 8 8 8zm0 1.5c-3.314 0-6 1.567-6 3.5V14h12v-1c0-1.933-2.686-3.5-6-3.5z" fill="currentColor"/></svg>} />
                          <FormField name="lastName" label="Last Name" placeholder="e.g. Sharma" submitCount={submitCount} />
                        </div>
                        <FormField name="dob" label="Date of Birth" type="date" submitCount={submitCount}
                          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1.5V4.5M11 1.5V4.5M1.5 7H14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>} />
                      </FormSection>

                      {/* ── Section B ── */}
                      <FormSection id="section-b" letter="B" title="Contact Details"
                        sectionRef={(el) => (sectionRefs.current[1] = el)} dataIndex="1">
                        <FormField name="email" label="Email Address" type="email" placeholder="you@example.com" submitCount={submitCount}
                          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 5.5L8 9.5L14.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>} />
                        <FormField name="phone" label="Phone Number" type="tel" placeholder="e.g. 9876543210" submitCount={submitCount}
                          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="1" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="12.5" r="0.8" fill="currentColor"/></svg>} />
                        <FormField name="address" label="Address" type="textarea" placeholder="Your full address..." submitCount={submitCount} />
                      </FormSection>

                      {/* ── Section C ── */}
                      <FormSection id="section-c" letter="C" title="Professional Background"
                        sectionRef={(el) => (sectionRefs.current[2] = el)} dataIndex="2">
                        <FormField name="company" label="Company / Organisation" placeholder="e.g. Vima3ya Technologies" submitCount={submitCount}
                          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 6V4.5C5 3.12 6.12 2 7.5 2h1C9.88 2 11 3.12 11 4.5V6" stroke="currentColor" strokeWidth="1.2"/></svg>} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField name="role" label="Your Role" type="select" placeholder="Select a role" submitCount={submitCount} options={ROLE_OPTIONS} />
                          <FormField name="experience" label="Years of Experience" type="select" placeholder="Select range" submitCount={submitCount} options={EXP_OPTIONS} />
                        </div>
                      </FormSection>

                      {/* ── Section D ── */}
                      <FormSection id="section-d" letter="D" title="Preferences"
                        sectionRef={(el) => (sectionRefs.current[3] = el)} dataIndex="3">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField name="interest" label="Area of Interest" type="select" placeholder="Select area" submitCount={submitCount} options={INTEREST_OPTIONS} />
                          <FormField name="timezone" label="Timezone" type="select" placeholder="Select timezone" submitCount={submitCount} options={TZ_OPTIONS} />
                        </div>
                        <FormField name="bio" label="Short Bio" type="textarea" placeholder="Tell us about yourself (min 20 characters)..." submitCount={submitCount} />
                      </FormSection>

                      {/* Submit row */}
                      <div className="flex items-center justify-between mt-2 mb-8">
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-secondary)' }}>
                          {Object.keys(errors).length > 0 && submitCount > 0
                            ? `${Object.keys(errors).length} field(s) need attention`
                            : submitSuccess
                            ? 'Submitted ✓'
                            : 'All required fields must be completed'}
                        </p>
                        <button type="submit" className="submit-btn" disabled={submitSuccess}
                          style={{ opacity: submitSuccess ? 0.5 : 1, cursor: submitSuccess ? 'not-allowed' : 'pointer' }}>
                          {submitSuccess ? 'Submitted' : 'Submit Form'}
                        </button>
                      </div>
                    </Form>
                  </FormAutoTrigger>
                );
              }}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
}
