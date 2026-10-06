import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  Send,
  Check,
  CheckCircle2,
  UploadCloud,
  AlertCircle,
  ArrowRight,
  Phone,
  X,
} from 'lucide-react';
import { JOB_CATEGORIES, JOB_POSITIONS } from '../../data/careersData';

export default function CareersPortal() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState('outstation-chauffeur');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Unified Form State (All roles require resume)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    livingArea: '',
    experience: '3-5 Years',
    resumeFile: null,
    notes: '',
  });

  const dialogRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedJob = JOB_POSITIONS.find((j) => j.id === selectedJobId) || JOB_POSITIONS[0];

  // Filtered jobs
  const filteredJobs =
    selectedCategory === 'all'
      ? JOB_POSITIONS
      : JOB_POSITIONS.filter((j) => j.category === selectedCategory);

  // Sync native dialog state with React isModalOpen state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      document.body.style.overflow = 'hidden';
    } else {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = '';
    }
  }, [isModalOpen]);

  // Native dialog event listeners and light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      setIsModalOpen(false);
      document.body.style.overflow = '';
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleClose);

    // Fallback for browsers without native closedby support (Safari, older Firefox)
    const handleBackdropClick = (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!isDialogContent) {
          dialog.close();
        }
      }
    };
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleClose);
      dialog.removeEventListener('click', handleBackdropClick);
      document.body.style.overflow = '';
    };
  }, []);

  // Listen for global custom events (e.g., from hero "Apply Online" button)
  useEffect(() => {
    const handleGlobalOpen = (e) => {
      if (e.detail?.jobId) {
        setSelectedJobId(e.detail.jobId);
      }
      setValidationError('');
      setIsModalOpen(true);
    };

    window.addEventListener('open-apply-modal', handleGlobalOpen);
    return () => window.removeEventListener('open-apply-modal', handleGlobalOpen);
  }, []);

  const handleOpenJobModal = (jobId) => {
    if (jobId) {
      setSelectedJobId(jobId);
    }
    setValidationError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationError('Resume file size exceeds 5MB limit. Please upload a smaller file.');
        return;
      }
      setFormData((prev) => ({ ...prev, resumeFile: file }));
      setValidationError('');
    }
  };

  const generateWhatsAppUrl = (customRefId = null) => {
    const name = formData.fullName.trim() || '[Applicant Name]';
    const phone = formData.phone.trim() || '[Phone Number]';
    const area = formData.livingArea.trim() || '[Area]';
    const roleTitle = selectedJob.title;
    const refId = customRefId || submittedData?.referenceId || `KT-APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fileName = formData.resumeFile ? formData.resumeFile.name : (submittedData?.fileName || 'Attached in chat');

    let text = `*Job Application — Kalidass Travels*\n\n`;
    text += `*Application ID:* ${refId}\n`;
    text += `*Position:* ${roleTitle}\n`;
    text += `*Applicant Name:* ${name}\n`;
    text += `*Mobile / WhatsApp:* ${phone}\n`;
    text += `*Residential Area:* ${area}\n`;
    text += `*Total Experience:* ${formData.experience}\n`;
    if (formData.email && formData.email.trim()) {
      text += `*Email:* ${formData.email.trim()}\n`;
    }
    if (formData.notes && formData.notes.trim()) {
      text += `*Notes:* ${formData.notes.trim()}\n`;
    }
    text += `*Resume Document:* ${fileName}\n\n`;
    text += `_Hi Kalidass Travels HR, I am applying for this role. I am attaching my Resume / Bio-data file in this chat._`;

    return `https://wa.me/918939539211?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.fullName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile or WhatsApp number.');
      return;
    }

    if (!formData.livingArea.trim()) {
      setValidationError('Please enter your current residential area in Chennai.');
      return;
    }

    // MANDATORY RESUME VALIDATION FOR ALL CANDIDATES
    if (!formData.resumeFile) {
      setValidationError('Please attach your Resume / Bio-data file (PDF, DOCX, or photo).');
      return;
    }

    setIsSubmitting(true);

    const refId = `KT-APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const waUrl = generateWhatsAppUrl(refId);

    // 1. Backup Lead Logging to Google Sheet (non-blocking)
    try {
      fetch('https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          tripType: `Careers Application: ${selectedJob.title}`,
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          pickup: formData.livingArea.trim(),
          drop: `Exp: ${formData.experience} | File: ${formData.resumeFile ? formData.resumeFile.name : 'In WhatsApp'}`,
          notes: formData.notes || '',
          email: formData.email || '',
          referenceId: refId
        })
      }).catch(() => {});
    } catch (_) {}

    // 2. Open WhatsApp immediately on user submission
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // 3. Set submitted state to show full guidance screen
    setSubmittedData({
      referenceId: refId,
      jobTitle: selectedJob.title,
      applicantName: formData.fullName,
      phone: formData.phone,
      fileName: formData.resumeFile.name,
      whatsAppUrl: waUrl,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });

    setIsSubmitting(false);
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setValidationError('');
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      livingArea: '',
      experience: '3-5 Years',
      resumeFile: null,
      notes: '',
    });
  };

  return (
    <div className="w-full">
      {/* 1. Category Filter Navigation (M3 Filter Chips) */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <h2 className="text-base sm:text-lg font-bold text-m3-on-surface font-heading tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-m3-primary shrink-0" />
            <span>Current Open Positions ({JOB_POSITIONS.length})</span>
          </h2>
          <span className="text-xs text-m3-on-surface-variant">
            Direct Company Hiring · Click Apply to Open Form
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none focus-visible:outline-none">
          {JOB_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-m3-full text-xs font-semibold whitespace-nowrap transition-all duration-200 min-h-[38px] shrink-0 border cursor-pointer ${
                  isActive
                    ? 'bg-m3-primary text-white border-m3-primary shadow-xs font-bold'
                    : 'bg-m3-surface text-m3-on-surface hover:bg-m3-surface-container border-m3-outline-variant/60'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Job Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-8">
        {filteredJobs.map((job) => {
          return (
            <div
              key={job.id}
              className="rounded-m3-xl border border-m3-outline-variant/60 hover:border-m3-primary/50 p-4 sm:p-4.5 bg-m3-surface flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-m3-1"
            >
              <div>
                {/* Header row: Category & Tags */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-m3-xs bg-m3-surface-container-high text-m3-primary">
                      {job.categoryLabel}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-m3-xs bg-slate-100 text-slate-700">
                      {job.employmentType}
                    </span>
                    {job.featuredBadge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-m3-xs bg-amber-500/15 text-amber-900 border border-amber-500/30">
                        {job.featuredBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-m3-xs border border-blue-200 shrink-0">
                    Resume Required
                  </span>
                </div>

                {/* Job Title */}
                <h3 className="text-sm sm:text-base font-bold text-m3-on-surface font-heading leading-snug">
                  {job.title}
                </h3>

                {/* Short Description */}
                <p className="text-xs text-m3-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                  {job.shortDescription}
                </p>

                {/* Compensation & Experience Strip */}
                <div className="mt-3 pt-2.5 border-t border-m3-outline-variant/40 flex flex-wrap items-baseline justify-between gap-2 text-xs">
                  <div>
                    <span className="font-extrabold text-m3-on-surface text-sm sm:text-base font-sans">
                      {job.salaryRange}
                    </span>
                    <div className="text-[11px] text-emerald-700 font-semibold">{job.bataOrPerks}</div>
                  </div>
                  <div className="text-right text-[11px] text-m3-on-surface-variant shrink-0">
                    <div>{job.experienceRequired}</div>
                    <div className="text-[10px] truncate max-w-[180px]">{job.location}</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-2.5 border-t border-m3-outline-variant/30 flex items-center justify-between gap-2">
                <span className="text-[11px] text-m3-on-surface-variant font-medium">
                  {job.department}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenJobModal(job.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-m3-full text-xs font-bold transition-all shadow-xs cursor-pointer bg-m3-primary hover:bg-m3-primary/90 text-white"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Direct Application Strip */}
      <div
        id="application-form"
        className="bg-m3-surface border border-m3-outline-variant/60 rounded-m3-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-m3-full bg-m3-primary/10 text-m3-primary text-xs font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Fast Online Hiring</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-m3-on-surface font-heading">
            Submit Your Resume Online
          </h3>
          <p className="text-xs text-m3-on-surface-variant max-w-lg">
            Click Apply on any open position above, or click below to launch the popup application form. Shortlisted applicants will be invited for a scheduled personal interview.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenJobModal()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-m3-full bg-m3-primary hover:bg-m3-primary/90 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Open Application Form</span>
          </button>
          <a
            href="https://wa.me/918939539211?text=Hi%20Kalidass%20Travels%20HR,%20I%20am%20sharing%20my%20resume%20for%20a%20job%20opening."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-m3-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
            </svg>
            <span>WhatsApp HR</span>
          </a>
        </div>
      </div>

      {/* 4. Native <dialog> Modal Popup Application Form */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="apply-modal-title"
        className="m-auto p-0 bg-transparent border-0 max-w-2xl w-[calc(100%-2rem)] max-h-[92vh] rounded-m3-2xl shadow-2xl focus:outline-none backdrop:bg-slate-950/75 backdrop:backdrop-blur-xs overflow-hidden"
      >
        <div className="bg-m3-surface text-m3-on-surface flex flex-col max-h-[92vh] rounded-m3-2xl border border-m3-outline-variant shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-slate-800 shrink-0">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 font-bold uppercase tracking-wider mb-1">
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Job Application &amp; Resume Submission</span>
              </div>
              <h2
                id="apply-modal-title"
                className="text-base sm:text-lg font-extrabold font-heading tracking-tight leading-snug"
              >
                Applying for: {selectedJob.title}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {selectedJob.department} · {selectedJob.location} · <span className="text-emerald-400 font-semibold">{selectedJob.salaryRange}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close application dialog"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {submittedData ? (
              /* Success / Confirmation State */
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                </div>

                <div className="max-w-md mx-auto space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-m3-xs bg-emerald-100 text-emerald-800">
                    Application Received · Opened in WhatsApp
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-m3-on-surface font-heading">
                    Thank You, {submittedData.applicantName}!
                  </h3>
                  <p className="text-xs sm:text-sm text-m3-on-surface-variant">
                    Your application for <span className="font-bold text-m3-on-surface">{submittedData.jobTitle}</span> was pre-filled and launched in WhatsApp to our HR team.
                  </p>
                </div>

                {/* Next Steps Guidance */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-m3-xl p-3.5 max-w-md mx-auto text-left space-y-2 text-xs text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>2 Quick Steps to Complete:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-emerald-800 text-[11px] sm:text-xs">
                    <li>Click <strong>Send</strong> in the WhatsApp chat with HR (+91 89395 39211).</li>
                    <li>Attach your resume file or photo (<span className="font-semibold">{submittedData.fileName}</span>) directly into the chat.</li>
                  </ol>
                </div>

                {/* Reference Badge */}
                <div className="bg-m3-surface-container-low border border-m3-outline-variant/60 rounded-m3-xl p-3.5 max-w-sm mx-auto text-left space-y-1 text-xs">
                  <div className="flex justify-between items-center text-m3-on-surface-variant">
                    <span>Application ID:</span>
                    <span className="font-mono font-bold text-m3-primary">{submittedData.referenceId}</span>
                  </div>
                  <div className="flex justify-between items-center text-m3-on-surface-variant">
                    <span>Registered Mobile:</span>
                    <span className="font-semibold text-m3-on-surface">{submittedData.phone}</span>
                  </div>
                  <div className="flex justify-between items-center text-m3-on-surface-variant">
                    <span>Resume File:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">{submittedData.fileName}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <a
                    href={submittedData.whatsAppUrl || generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-m3-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs min-h-[42px] transition-colors"
                  >
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                    </svg>
                    <span>Open WhatsApp Chat Again</span>
                  </a>

                  <a
                    href="tel:+918939539211"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-m3-full bg-m3-surface hover:bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface font-semibold text-xs min-h-[42px] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call HR (+91 89395 39211)</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-1 px-4 py-2.5 rounded-m3-full bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface font-semibold text-xs min-h-[42px] transition-colors cursor-pointer"
                  >
                    <span>Apply for Another Role</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="inline-flex items-center gap-1 px-4 py-2.5 rounded-m3-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs min-h-[42px] transition-colors cursor-pointer"
                  >
                    <span>Close</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Actual Interactive Form */
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Validation Error Banner */}
                {validationError && (
                  <div
                    role="alert"
                    className="p-3 rounded-m3-lg bg-red-500/10 border border-red-500/30 text-red-800 text-xs font-semibold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Position Selector Dropdown */}
                <div>
                  <label htmlFor="modalPositionSelect" className="block text-xs font-bold text-m3-on-surface mb-1">
                    Applying Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modalPositionSelect"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container border border-m3-outline-variant/60 focus:border-m3-primary focus:bg-white text-xs sm:text-sm min-h-[44px] focus-visible:outline-none"
                  >
                    {JOB_POSITIONS.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} — {job.salaryRange} ({job.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="modalFullName" className="block text-xs font-bold text-m3-on-surface mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modalFullName"
                      name="fullName"
                      type="text"
                      required
                      autoComplete="name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. R. Saravanan"
                      className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container border border-m3-outline-variant/60 focus:border-m3-primary focus:bg-white text-xs sm:text-sm min-h-[44px] focus-visible:outline-none"
                    />
                  </div>

                  {/* Mobile / WhatsApp Number */}
                  <div>
                    <label htmlFor="modalPhone" className="block text-xs font-bold text-m3-on-surface mb-1">
                      Mobile / WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modalPhone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 98401 23456"
                      className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container border border-m3-outline-variant/60 focus:border-m3-primary focus:bg-white text-xs sm:text-sm min-h-[44px] focus-visible:outline-none"
                    />
                  </div>

                  {/* Residential Area */}
                  <div>
                    <label htmlFor="modalLivingArea" className="block text-xs font-bold text-m3-on-surface mb-1">
                      Residential Area in Chennai <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="modalLivingArea"
                      name="livingArea"
                      type="text"
                      required
                      value={formData.livingArea}
                      onChange={handleInputChange}
                      placeholder="e.g. Medavakkam, Tambaram"
                      className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container border border-m3-outline-variant/60 focus:border-m3-primary focus:bg-white text-xs sm:text-sm min-h-[44px] focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Total Relevant Experience */}
                  <div>
                    <label htmlFor="modalExperience" className="block text-xs font-bold text-m3-on-surface mb-1">
                      Total Relevant Experience <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="modalExperience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container border border-m3-outline-variant/60 focus:border-m3-primary focus:bg-white text-xs sm:text-sm min-h-[44px] focus-visible:outline-none"
                    >
                      <option value="Fresher">Fresher / Eager to Learn</option>
                      <option value="1-3 Years">1 – 3 Years Experience</option>
                      <option value="3-5 Years">3 – 5 Years Experience</option>
                      <option value="5-10 Years Expert">5 – 10 Years Experienced</option>
                      <option value="10+ Years Veteran">10+ Years Veteran</option>
                    </select>
                  </div>

                  {/* Email Address (Optional) */}
                  <div>
                    <label htmlFor="modalEmail" className="block text-xs font-bold text-m3-on-surface mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      id="modalEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. candidate@example.com"
                      className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container border border-m3-outline-variant/60 focus:border-m3-primary focus:bg-white text-xs sm:text-sm min-h-[44px] focus-visible:outline-none"
                    />
                  </div>
                </div>

                {/* Resume Upload Section */}
                <div className="pt-2 border-t border-m3-outline-variant/40">
                  <label className="block text-xs font-bold text-m3-on-surface mb-1">
                    Attach Resume / Bio-data <span className="text-red-500">* Required</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-m3-xl p-4 text-center transition-colors ${
                      formData.resumeFile
                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                        : 'border-m3-outline-variant/80 hover:border-m3-primary bg-m3-surface-container-low'
                    }`}
                  >
                    <UploadCloud className="w-7 h-7 text-m3-primary mb-1 mx-auto" />
                    <div className="text-xs sm:text-sm font-bold text-m3-on-surface">
                      {formData.resumeFile ? (
                        <span className="text-emerald-700 flex items-center justify-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          {formData.resumeFile.name} ({(formData.resumeFile.size / 1024).toFixed(0)} KB)
                        </span>
                      ) : (
                        'Click to select or drop your Resume file'
                      )}
                    </div>
                    <div className="text-[11px] text-m3-on-surface-variant mt-0.5">
                      Accepts PDF, DOCX, DOC, or photo/image of bio-data (Max 5MB)
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Optional Notes */}
                <div>
                  <label htmlFor="modalNotes" className="block text-xs font-bold text-m3-on-surface mb-1">
                    Additional Note / Message (Optional)
                  </label>
                  <input
                    id="modalNotes"
                    name="notes"
                    type="text"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Can join immediately / Preferred shift / License badge details"
                    className="w-full px-3 py-2 rounded-m3-sm bg-m3-surface-container border border-m3-outline-variant/60 focus:border-m3-primary focus:bg-white text-xs sm:text-sm min-h-[44px] focus-visible:outline-none"
                  />
                </div>

                {/* Submit Bar */}
                <div className="pt-3 border-t border-m3-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-micro text-m3-on-surface-variant text-center sm:text-left">
                    <span>Direct submission to Kalidass Travels HR desk (+91 89395 39211).</span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-m3-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs min-h-[44px] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                      </svg>
                      <span>{isSubmitting ? 'Opening WhatsApp...' : 'Apply & Send via WhatsApp'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct HR Contact Option */}
                <div className="pt-2 text-center text-xs text-m3-on-surface-variant flex items-center justify-center gap-2 flex-wrap">
                  <span>Questions or prefer calling?</span>
                  <a
                    href="tel:+918939539211"
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Call Medavakkam HR Hub (+91 89395 39211)</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
