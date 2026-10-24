// Seeds demo data. Safe to run many times: it removes only sample records
// (isSample: true) and anything linked to them, then inserts fresh ones.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Session from '../models/Session.js';
import Message from '../models/Message.js';
import { mentors, students, DEMO_PASSWORD } from './data.js';

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (d, hour = 17) => {
  const date = new Date(Date.now() + d * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function run() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`[seed] Connected to ${mongoose.connection.name}`);

  // 1. Clean previous sample data (and anything that points at sample users).
  const oldIds = (await User.find({ isSample: true }).select('_id').lean()).map((u) => u._id);
  const linked = { $or: [{ isSample: true }, { student: { $in: oldIds } }, { mentor: { $in: oldIds } }] };
  await Promise.all([
    MentorshipRequest.deleteMany(linked),
    Session.deleteMany(linked),
    Message.deleteMany({ $or: [{ isSample: true }, { sender: { $in: oldIds } }, { receiver: { $in: oldIds } }] }),
  ]);
  await User.deleteMany({ isSample: true });
  // Remove deleted sample mentors from real students' "recently viewed" lists.
  await User.updateMany({}, { $pull: { recentlyViewedMentors: { $in: oldIds } } });

  // 2. Users. Hash the shared demo password once to keep seeding fast.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const mentorDocs = await User.insertMany(
    mentors.map((m, i) => ({ ...m, email: `mentor${i + 1}@example.com`, role: 'mentor', passwordHash, isSample: true }))
  );
  const studentDocs = await User.insertMany(
    students.map((s, i) => ({ ...s, email: `student${i + 1}@example.com`, role: 'student', passwordHash, isSample: true }))
  );
  const [ananya, karthik, priya, rahul, meera, arjun] = mentorDocs;
  const [aisha, rohan, nila] = studentDocs;

  // Give student1 a couple of recently viewed mentors so the dashboard has something to show.
  aisha.recentlyViewedMentors = [karthik._id, ananya._id];
  await aisha.save();

  // 3. Requests in every status.
  const req = (student, mentor, category, goals, status, extra = {}) => ({
    student: student._id,
    mentor: mentor._id,
    category,
    goals,
    status,
    isSample: true,
    ...(status !== 'pending' ? { respondedAt: daysFromNow(-20) } : {}),
    ...extra,
  });
  const [aishaKarthik, , rohanPriya, , nilaArjun] = await MentorshipRequest.insertMany([
    req(aisha, karthik, 'Web Development', 'I want to build and deploy a full MERN project and get feedback on my code quality.', 'accepted', { mentorResponse: 'Happy to help! Let us start with your project plan.' }),
    req(aisha, ananya, 'Interview Preparation', 'I need a structured plan for DSA practice before internship interviews in three months.', 'pending'),
    req(rohan, priya, 'Data Science', 'I would like guidance on my first end-to-end data analysis project using real public datasets.', 'accepted', { mentorResponse: 'Great goal. Bring a dataset you find interesting.' }),
    req(rohan, rahul, 'AI/ML', 'I want to understand deep learning basics and train a small image classifier.', 'rejected', { mentorResponse: 'I am fully booked this month. Please try again next month.' }),
    req(nila, arjun, 'Interview Preparation', 'I want mock HR interviews and resume feedback before campus placements start.', 'completed', {
      mentorResponse: 'Accepted. Let us do three mock interviews.',
      completedAt: daysFromNow(-3),
      review: { rating: 5, comment: 'The mock interviews were realistic and the resume feedback was very specific. Sample review (demo content).', createdAt: daysFromNow(-2) },
    }),
    req(nila, meera, 'Communication Skills', 'I want to become more confident presenting my final-year project to a panel.', 'pending'),
  ]);

  // 4. Sessions: upcoming, completed and cancelled.
  await Session.insertMany([
    { request: aishaKarthik._id, student: aisha._id, mentor: karthik._id, title: 'Project kickoff: MERN app plan', description: 'Review the feature list and agree on the first milestone.', scheduledAt: daysFromNow(3), durationMinutes: 60, meetingUrl: 'https://meet.example.com/mentorconnect-demo-1', status: 'scheduled', createdBy: karthik._id, isSample: true },
    { request: aishaKarthik._id, student: aisha._id, mentor: karthik._id, title: 'Intro call', description: 'Getting to know each other and setting goals.', scheduledAt: daysFromNow(-10), durationMinutes: 30, status: 'completed', createdBy: karthik._id, isSample: true },
    { request: rohanPriya._id, student: rohan._id, mentor: priya._id, title: 'Choosing a dataset', description: 'Shortlist datasets and define the analysis question.', scheduledAt: daysFromNow(5, 19), durationMinutes: 45, status: 'scheduled', createdBy: rohan._id, isSample: true },
    { request: nilaArjun._id, student: nila._id, mentor: arjun._id, title: 'Mock HR interview #1', description: 'Full-length mock interview with feedback.', scheduledAt: daysFromNow(-8, 11), durationMinutes: 60, status: 'completed', createdBy: arjun._id, isSample: true },
  ]);

  // 5. A short conversation between a connected pair.
  const t = (minsAgo) => new Date(Date.now() - minsAgo * 60 * 1000);
  await Message.insertMany([
    { sender: aisha._id, receiver: karthik._id, text: 'Hi Karthik, thanks for accepting! I have shared my project idea in the session notes.', read: true, createdAt: t(300), isSample: true },
    { sender: karthik._id, receiver: aisha._id, text: 'Looks good. Before Thursday, please sketch the main screens on paper.', read: false, createdAt: t(240), isSample: true },
    { sender: rohan._id, receiver: priya._id, text: 'Hello! Is a Kaggle dataset okay for the first project?', read: false, createdAt: t(60), isSample: true },
  ]);

  console.log('[seed] Inserted %d mentors, %d students, 6 requests, 4 sessions, 3 messages', mentorDocs.length, studentDocs.length);
  console.log('\n================  DEMO ACCOUNTS (demo only, not real people)  ================');
  console.log(`  Password for every demo account: ${DEMO_PASSWORD}`);
  console.log('  Students: student1@example.com (Aisha), student2@example.com (Rohan), student3@example.com (Nila)');
  console.log('  Mentors : mentor1@example.com ... mentor10@example.com  (mentor2 = Karthik, has an accepted student)');
  console.log('===============================================================================\n');
}

run()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
