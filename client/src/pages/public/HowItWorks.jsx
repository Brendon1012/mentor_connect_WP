import { ArrowRight, CheckCircle2 } from 'lucide-react';
import HowItWorksSteps from '../../components/mentors/HowItWorksSteps.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import './InfoPages.css';

const FAQ = [
  ['Is MentorConnect free for students?', 'Yes. Students can create an account, browse mentors and send requests at no cost.'],
  ['How long does a mentor take to respond?', 'It depends on the mentor. You can see the status of every request on your dashboard, and you will see the mentor’s response there as soon as they reply.'],
  ['Can I request more than one mentor?', 'Yes. You can have requests with several mentors, but only one active (pending or accepted) request with the same mentor at a time.'],
  ['What happens if a mentor declines?', 'You can look for another mentor, or send a new request to the same mentor later when they have more time.'],
  ['How do sessions happen?', 'Sessions are scheduled inside MentorConnect. The meeting itself happens on a link the mentor or student adds (for example a video-call link). MentorConnect does not host video calls.'],
  ['Who can message whom?', 'Messaging opens only after a mentor accepts a request, so you will never get messages from strangers.'],
];

export default function HowItWorks() {
  useDocumentTitle('How It Works');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h1>From sign-up to your first session</h1>
          <p>MentorConnect keeps mentorship simple: a clear request, a mentor who says yes, and organised sessions you both can track.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <HowItWorksSteps />
        </div>
      </section>

      <section className="section section-alt" style={{ background: 'var(--white)' }}>
        <div className="container role-columns">
          <div className="card">
            <h2>For students</h2>
            <ul className="check-list">
              <li><CheckCircle2 aria-hidden="true" /> Fill in your skills and career interests to get mentor recommendations.</li>
              <li><CheckCircle2 aria-hidden="true" /> Send a request with clear goals (at least 20 characters).</li>
              <li><CheckCircle2 aria-hidden="true" /> Once accepted, schedule sessions and message your mentor.</li>
              <li><CheckCircle2 aria-hidden="true" /> When the mentorship is completed, leave honest feedback.</li>
            </ul>
            <Button to="/register" variant="cta" style={{ marginTop: 20 }}>Join as a student <ArrowRight aria-hidden="true" /></Button>
          </div>
          <div className="card">
            <h2>For mentors</h2>
            <ul className="check-list">
              <li><CheckCircle2 aria-hidden="true" /> Build a profile with your skills, experience and availability.</li>
              <li><CheckCircle2 aria-hidden="true" /> Review each request and accept or decline it with a short note.</li>
              <li><CheckCircle2 aria-hidden="true" /> Schedule, reschedule and complete sessions from your dashboard.</li>
              <li><CheckCircle2 aria-hidden="true" /> Pause new requests any time by turning off "Accepting students".</li>
            </ul>
            <Button to="/register?role=mentor" variant="outline" style={{ marginTop: 20 }}>Become a mentor <ArrowRight aria-hidden="true" /></Button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <h2>The life of a mentorship request</h2>
          <p className="muted">Every request moves through these stages. Only the mentor can move it forward.</p>
          <div className="status-flow card">
            <Badge tone="warning">Pending</Badge> <ArrowRight aria-hidden="true" />
            <Badge tone="success">Accepted</Badge> <ArrowRight aria-hidden="true" />
            <Badge tone="info">Completed</Badge>
            <span className="muted small" style={{ marginLeft: 8 }}>or</span>
            <Badge tone="warning">Pending</Badge> <ArrowRight aria-hidden="true" />
            <Badge tone="danger">Declined</Badge>
          </div>

          <h2 style={{ marginTop: 48 }}>Frequently asked questions</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
