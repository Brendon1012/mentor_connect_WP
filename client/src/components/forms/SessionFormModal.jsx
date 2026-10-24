import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input, Select, Textarea, FormAlert } from '../ui/FormField.jsx';
import { sessionService } from '../../services/resources.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { toDateTimeLocal } from '../../utils/formatters.js';
import { isHttpUrl, compactErrors } from '../../utils/validators.js';

const blank = () => ({ requestId: '', title: '', description: '', scheduledAt: '', durationMinutes: '60', meetingUrl: '' });

/*
 * Create a session (pass `mentorships` = accepted requests to choose from, or `requestId`)
 * or edit/reschedule one (pass `session`).
 */
export default function SessionFormModal({ open, onClose, onSaved, session, mentorships = [], requestId, viewerRole }) {
  const editing = Boolean(session);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError('');
    setForm(
      editing
        ? {
            requestId: session.request?._id || session.request,
            title: session.title,
            description: session.description || '',
            scheduledAt: toDateTimeLocal(session.scheduledAt),
            durationMinutes: String(session.durationMinutes),
            meetingUrl: session.meetingUrl || '',
          }
        : { ...blank(), requestId: requestId || (mentorships.length === 1 ? mentorships[0]._id : '') }
    );
    // Reset only when the dialog opens.
  }, [open]);

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const when = form.scheduledAt ? new Date(form.scheduledAt) : null;
    const found = compactErrors({
      requestId: !editing && !form.requestId ? 'Choose a mentorship' : '',
      title: form.title.trim().length < 3 ? 'Title must be at least 3 characters' : '',
      scheduledAt: !when ? 'Pick a date and time' : when.getTime() <= Date.now() ? 'Choose a time in the future' : '',
      meetingUrl: form.meetingUrl.trim() && !isHttpUrl(form.meetingUrl) ? 'Link must start with http:// or https://' : '',
    });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      scheduledAt: when.toISOString(),
      durationMinutes: Number(form.durationMinutes),
      meetingUrl: form.meetingUrl.trim(),
    };

    setSubmitting(true);
    try {
      const data = editing
        ? await sessionService.update(session._id, payload)
        : await sessionService.create({ ...payload, requestId: form.requestId });
      toast.success(editing ? 'Session updated' : 'Session scheduled');
      onSaved?.(data.session);
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not save the session.'));
    } finally {
      setSubmitting(false);
    }
  }

  const otherName = (r) => (viewerRole === 'student' ? r.mentor?.name : r.student?.name);

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} title={editing ? 'Edit or reschedule session' : 'Schedule a session'}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormAlert message={formError} />
        {!editing && !requestId && (
          <Select label="Mentorship" name="requestId" value={form.requestId} onChange={change} error={errors.requestId} required>
            <option value="">Choose who the session is with</option>
            {mentorships.map((r) => (
              <option key={r._id} value={r._id}>
                {otherName(r)} - {r.category}
              </option>
            ))}
          </Select>
        )}
        <Input label="Title" name="title" value={form.title} onChange={change} error={errors.title} required maxLength={120} placeholder="e.g. Resume review" />
        <div className="form-row">
          <Input
            label="Date and time"
            name="scheduledAt"
            type="datetime-local"
            value={form.scheduledAt}
            min={toDateTimeLocal(Date.now())}
            onChange={change}
            error={errors.scheduledAt}
            required
          />
          <Select label="Duration" name="durationMinutes" value={form.durationMinutes} onChange={change}>
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </Select>
        </div>
        <Input
          label="Meeting link"
          name="meetingUrl"
          type="url"
          value={form.meetingUrl}
          onChange={change}
          error={errors.meetingUrl}
          hint="Optional. Paste a video-call link (Google Meet, Zoom, Teams...)."
          placeholder="https://"
        />
        <Textarea label="Agenda / notes" name="description" value={form.description} onChange={change} error={errors.description} rows={3} maxLength={1000} showCount />
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {editing ? 'Save changes' : 'Schedule session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
