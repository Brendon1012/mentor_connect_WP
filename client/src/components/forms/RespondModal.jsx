import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Textarea, FormAlert } from '../ui/FormField.jsx';

// Mentor accepts or declines a request, with an optional short note to the student.
export default function RespondModal({ open, onClose, action, studentName, onConfirm }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const accepting = action === 'accept';

  useEffect(() => {
    if (open) {
      setNote('');
      setError('');
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(note.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} title={accepting ? `Accept ${studentName}'s request` : `Decline ${studentName}'s request`}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormAlert message={error} />
        <Textarea
          label={accepting ? 'Welcome note (optional)' : 'Reason (optional)'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          showCount
          placeholder={accepting ? 'e.g. Happy to help! Let us schedule our first session.' : 'e.g. I am fully booked this month.'}
        />
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant={accepting ? 'primary' : 'danger'} loading={submitting}>
            {accepting ? 'Accept request' : 'Decline request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
