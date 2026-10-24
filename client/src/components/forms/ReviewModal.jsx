import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Textarea, FormAlert } from '../ui/FormField.jsx';
import { requestService } from '../../services/resources.js';
import { getErrorMessage } from '../../services/api.js';

export default function ReviewModal({ open, onClose, request, onSaved }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setComment('');
      setError('');
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!rating) return setError('Choose a rating from 1 to 5 stars');
    setSubmitting(true);
    setError('');
    try {
      await requestService.review(request._id, { rating, comment: comment.trim() });
      toast.success('Thanks for your feedback');
      onSaved?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} title={`Rate your mentorship with ${request?.mentor?.name || ''}`}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormAlert message={error} />
        <fieldset className="fieldset">
          <legend className="legend">Rating</legend>
          <div className="star-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={n <= rating} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}>
                <Star fill={n <= rating ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>
        <Textarea label="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500} showCount hint="Shown publicly on the mentor's profile with your name." />
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="primary" loading={submitting}>Submit feedback</Button>
        </div>
      </form>
    </Modal>
  );
}
