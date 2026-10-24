import { Compass, Eye, HeartHandshake, Lightbulb, Network, Target, TrendingUp, UserCheck } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import './InfoPages.css';

const BENEFITS = [
  { icon: Compass, title: 'Clear direction', text: 'A mentor helps you choose what to learn next instead of guessing from a hundred online roadmaps.' },
  { icon: TrendingUp, title: 'Faster growth', text: 'Regular feedback on real work (code, resumes, presentations) speeds up improvement.' },
  { icon: Network, title: 'Professional network', text: 'Mentors share how their industry actually works and who to learn from.' },
  { icon: UserCheck, title: 'Confidence', text: 'Practising interviews and presentations with someone experienced reduces anxiety.' },
];

const SUPPORT = [
  { icon: Target, title: 'Goal-first requests', text: 'Every request starts with the student’s own goals, so sessions stay focused.' },
  { icon: Lightbulb, title: 'Smart recommendations', text: 'Your skills and interests are matched against mentor skills and categories.' },
  { icon: HeartHandshake, title: 'Structured sessions', text: 'Sessions have a title, time and notes, and both sides can see upcoming and past sessions.' },
];

export default function About() {
  useDocumentTitle('About');
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">About MentorConnect</span>
          <h1>Making good guidance easy to find</h1>
          <p>
            MentorConnect is a student mentorship portal built as a Web Technology college project. It connects students
            with faculty, alumni and industry professionals who volunteer their time to guide the next generation.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container two-col">
          <div className="card mv-card">
            <div className="feature">
              <span className="feature-icon" aria-hidden="true"><Target /></span>
              <div>
                <h2 style={{ fontSize: '1.3rem' }}>Our mission</h2>
                <p>To give every student access to a mentor who can answer the questions that textbooks cannot, and to make
                  asking for help feel normal.</p>
              </div>
            </div>
          </div>
          <div className="card mv-card">
            <div className="feature">
              <span className="feature-icon" aria-hidden="true"><Eye /></span>
              <div>
                <h2 style={{ fontSize: '1.3rem' }}>Our vision</h2>
                <p>A campus culture where experienced people routinely share what they know, and students graduate with
                  both skills and direction.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Why mentorship</span>
            <h2>Benefits of having a mentor</h2>
          </div>
          <div className="grid-2">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="feature card">
                <span className="feature-icon" aria-hidden="true"><Icon /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Student development</span>
            <h2>How the platform supports you</h2>
          </div>
          <div className="grid-3">
            {SUPPORT.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card feature">
                <span className="feature-icon" aria-hidden="true"><Icon /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="section-actions">
            <Button to="/mentors" variant="cta">Find your mentor</Button>
          </div>
        </div>
      </section>
    </>
  );
}
