import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Select, Textarea, FormAlert } from '../ui/FormField.jsx';
import { requestService } from '../../services/resources.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { CATEGORIES } from '../../utils/constants.js';

const MIN = 20;
const MAX = 1000;

export default function RequestMentorshipModal({ mentor, open, onClose, onSuccess }) {
  const mentorCats = mentor?.mentorProfile?.categories || [];
  // Show the mentor's own categories first, then the rest.
  const options = [...mentorCats, ...CATEGORIES.filter((c) => !mentorCats.includes(c))];
  const [category, setCategory] = useState(mentorCats[0] || '');
  const [goals, setGoals] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const found = {};
    if (!category) found.category = 'Choose a category';
    if (goals.trim().length < MIN) found.goals = `Describe your goals in at least ${MIN} characters`;
    if (goals.trim().length > MAX) found.goals = `Keep it under ${MAX} characters`;
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const data = await requestService.create({ mentorId: mentor._id, category, goals: goals.trim() });
      toast.success(`Request sent to ${mentor.name}`);
      setGoals('');
      onSuccess?.(data.request);
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not send your request.'));
    } finally {
      setSubmitting(false);
    }
  }

  const trimmedLength = goals.trim().length;

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} title={`Request mentorship from ${mentor?.name || ''}`}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <p className="muted small" style={{ margin: 0 }}>
          Tell the mentor what you would like help with. They will accept or decline your request, and you will see
          the result on your dashboard.
        </p>
        <FormAlert message={formError} />
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} error={errors.category} required>
          <option value="">Select a category</option>
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
              {mentorCats.includes(c) ? ' (mentor specialises)' : ''}
            </option>
          ))}
        </Select>
        <Textarea
          label="Your goals"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          error={errors.goals}
          required
          rows={5}
          maxLength={MAX}
          showCount
          hint={trimmedLength < MIN ? `At least ${MIN} characters (${MIN - trimmedLength} more needed)` : 'Looks good'}
          placeholder="e.g. I want to prepare for software internship interviews and build a portfolio project in the next 3 months."
        />
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitting ? 'Sending...' : 'Send request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
