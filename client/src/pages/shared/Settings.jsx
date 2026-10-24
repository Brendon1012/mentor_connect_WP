import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { authService } from '../../services/authService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { PasswordInput, FormAlert } from '../../components/ui/FormField.jsx';
import { PageHeader } from '../../components/ui/Misc.jsx';
import Button from '../../components/ui/Button.jsx';
import { isStrongPassword, PASSWORD_HINT, compactErrors } from '../../utils/validators.js';
import { formatDate } from '../../utils/formatters.js';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function Settings() {
  useDocumentTitle('Settings');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const found = compactErrors({
      currentPassword: !form.currentPassword ? 'Enter your current password' : '',
      newPassword: !isStrongPassword(form.newPassword) ? PASSWORD_HINT : form.newPassword === form.currentPassword ? 'New password must be different from the current one' : '',
      confirmPassword: form.confirmPassword !== form.newPassword ? 'Passwords do not match' : '',
    });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await authService.changePassword(form);
      toast.success('Password updated');
      setForm(EMPTY);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not change your password.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    toast.success('You have been logged out');
    navigate('/login');
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account security." />
      <div className="stack" style={{ maxWidth: 640 }}>
        <section className="card" aria-labelledby="acct-h">
          <h2 id="acct-h" style={{ fontSize: '1.1rem' }}>Account</h2>
          <dl className="detail-list" style={{ display: 'grid', gap: 12 }}>
            <div><dt className="small muted">Email</dt><dd style={{ margin: 0, fontWeight: 600, color: 'var(--navy)' }}>{user.email}</dd></div>
            <div><dt className="small muted">Role</dt><dd style={{ margin: 0, fontWeight: 600, color: 'var(--navy)', textTransform: 'capitalize' }}>{user.role}</dd></div>
            <div><dt className="small muted">Member since</dt><dd style={{ margin: 0, fontWeight: 600, color: 'var(--navy)' }}>{formatDate(user.createdAt)}</dd></div>
          </dl>
        </section>

        <section className="card" aria-labelledby="pw-h">
          <h2 id="pw-h" style={{ fontSize: '1.1rem' }}><ShieldCheck size={18} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px', color: 'var(--blue)' }} /> Change password</h2>
          <form className="form" onSubmit={handleSubmit} noValidate>
            <FormAlert message={formError} />
            <PasswordInput label="Current password" name="currentPassword" autoComplete="current-password" value={form.currentPassword} onChange={change} error={errors.currentPassword} required />
            <PasswordInput label="New password" name="newPassword" autoComplete="new-password" value={form.newPassword} onChange={change} error={errors.newPassword} hint={PASSWORD_HINT} required />
            <PasswordInput label="Confirm new password" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={change} error={errors.confirmPassword} required />
            <div className="form-actions">
              <Button type="submit" variant="primary" loading={saving}>Update password</Button>
            </div>
          </form>
        </section>

        <section className="card row-between" aria-labelledby="lo-h">
          <div>
            <h2 id="lo-h" style={{ fontSize: '1.1rem', marginBottom: 4 }}>Log out</h2>
            <p className="small muted" style={{ margin: 0 }}>End your session on this device.</p>
          </div>
          <Button variant="danger" onClick={handleLogout}><LogOut aria-hidden="true" /> Logout</Button>
        </section>
      </div>
    </>
  );
}
