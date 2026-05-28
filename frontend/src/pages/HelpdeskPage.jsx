import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const issuePresets = [
  { id: 'general', label: 'General' },
  { id: 'order', label: 'Order' },
  { id: 'payment', label: 'Payment' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'technical', label: 'Technical' }
];

const priorities = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' }
];

const chipClass = selected =>
  `rounded-full border px-4 py-2 text-sm transition ${selected ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-200' : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'}`;

const fieldInputClass =
  'block w-full border border-white/15 bg-slate-900/70 px-4 py-3 text-slate-100 placeholder:text-slate-500';

const HelpdeskPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    issueType: 'general',
    priority: 'medium',
    subject: '',
    message: ''
  });

  const submitMutation = useMutation({
    mutationFn: payload =>
      api.post('/helpdesk', { ...payload, pageUrl: window.location.href }),
    onSuccess: () => {
      setForm(prev => ({ ...prev, subject: '', message: '' }));
    }
  });

  const messageLength = form.message.length;

  return (
    <div className="space-y-6">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold text-white">Helpdesk</h1>
        <p className="mt-2 text-slate-300">Report inconvenience, bugs, payment issues, or anything else to our support team.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {issuePresets.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, issueType: item.id }))}
              className={chipClass(form.issueType === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
      <section className="glass-card p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Your name</label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              className={fieldInputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Your email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              className={fieldInputClass}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-3 block text-sm text-slate-300">Priority</label>
          <div className="flex flex-wrap gap-3">
            {priorities.map(priority => (
              <button
                key={priority.id}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, priority: priority.id }))}
                className={chipClass(form.priority === priority.id)}
              >
                {priority.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Issue subject</label>
            <input
              value={form.subject}
              onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Short title for your issue"
              className={fieldInputClass}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label className="block text-sm text-slate-300">Issue details</label>
              <span className={`shrink-0 text-xs ${messageLength > 600 ? 'text-amber-300' : 'text-slate-400'}`}>{messageLength}/1000</span>
            </div>
            <textarea
              rows={6}
              value={form.message}
              maxLength={1000}
              onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Describe what happened, expected behavior, and steps to reproduce..."
              className={`${fieldInputClass} min-h-[9rem] resize-y`}
            />
          </div>

          <button
            type="button"
            onClick={() => submitMutation.mutate(form)}
            disabled={submitMutation.isPending}
            className="w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
          </button>
          {submitMutation.isSuccess && <p className="text-sm text-emerald-300">Ticket submitted successfully. We will get back to you soon.</p>}
          {submitMutation.isError && <p className="text-sm text-rose-300">{submitMutation.error?.message || 'Unable to submit ticket'}</p>}
        </div>
      </section>
    </div>
  );
};

export default HelpdeskPage;
