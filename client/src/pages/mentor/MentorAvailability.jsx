import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { mentorService } from '../../services/resources.js';
import { getErrorMessage } from '../../services/api.js';
import { Input, FormAlert } from '../../components/ui/FormField.jsx';
import { PageHeader } from '../../components/ui/Misc.jsx';
import Button from '../../components/ui/Button.jsx';
import { WEEK_DAYS } from '../../utils/constants.js';
import '../../components/dashboard/Dashboard.css';

const fromUser = (user) => {
  const a = user.mentorProfile?.availability || {};
  return { days: a.days || [], timeNotes: a.timeNotes || '', isAcceptingStudents: a.isAcceptingStudents !== false };
};

export default function MentorAvailability() {
  useDocumentTitle('Availability');
  const { user, applyAuth } = useAuth();
  const [form, setForm] = useState(() => fromUser(user));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromUser(user));
  }, [user]);

  const toggleDay = (d) =>
    setForm((f) => ({
      ...f,
      // Keep days in week order no matter which order they were clicked.
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : WEEK_DAYS.filter((x) => x === d || f.days.includes(x)),
    }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const result = await mentorService.updateProfile({
        availability: { days: form.days, timeNotes: form.timeNotes.trim(), isAcceptingStudents: form.isAcceptingStudents },
      });
      applyAuth(result);
      toast.success('Availability saved');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save availability.'));
      toast.error('Availability not saved');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Availability" subtitle="Let students know when you are usually free, and pause new requests when you are busy." />
      <form className="card profile-form-section" onSubmit={handleSubmit} noValidate style={{ maxWidth: 720 }}>
        <FormAlert message={error} />

        <label className="checkbox" style={{ fontSize: '1rem' }}>
          <input
            type="checkbox"
            checked={form.isAcceptingStudents}
            onChange={(e) => setForm((f) => ({ ...f, isAcceptingStudents: e.target.checked }))}
          />
          <span>
            <strong style={{ color: 'var(--navy)' }}>Accepting new students</strong>
            <br />
            <span className="small muted">When off, students can still see your profile but cannot send new requests. Existing mentorships are not affected.</span>
          </span>
        </label>

        <fieldset className="fieldset">
          <legend className="legend">Days you are usually available</legend>
          <div className="day-picker">
            {WEEK_DAYS.map((d) => (
              <label key={d}>
                <input type="checkbox" checked={form.days.includes(d)} onChange={() => toggleDay(d)} />
                {d}
              </label>
            ))}
          </div>
        </fieldset>

        <Input
          label="Time notes"
          value={form.timeNotes}
          onChange={(e) => setForm((f) => ({ ...f, timeNotes: e.target.value }))}
          maxLength={200}
          hint='e.g. "6:00 PM - 8:00 PM IST" or "Weekend mornings"'
        />

        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>Save availability</Button>
        </div>
      </form>
    </>
  );
}
