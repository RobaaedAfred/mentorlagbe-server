
import { auth } from "./auth";
import { Applications, Payments, Tuitions, Users, client } from "./config/db";
import type { ApplicationDoc, Role, TuitionDoc } from "./types";

const PASSWORD = "Mentor@123";

const people: { name: string; email: string; role: Role; bio: string; phone: string; plan?: "pro" }[] = [
  { name: "Platform Admin", email: "admin@mentorlagbe.com", role: "admin", bio: "MentorLagbe platform administrator.", phone: "+8801700000000" },
  { name: "Dr. Farhana Rahman", email: "farhana@mentorlagbe.com", role: "tutor", plan: "pro", phone: "+8801711000001", bio: "PhD in Physics, 9 years teaching HSC & A-Level students." },
  { name: "Tanvir Ahmed", email: "tanvir@mentorlagbe.com", role: "tutor", plan: "pro", phone: "+8801711000002", bio: "Software engineer and mentor for competitive programming." },
  { name: "Nusrat Jahan", email: "nusrat@mentorlagbe.com", role: "tutor", phone: "+8801711000003", bio: "IELTS 8.5 scorer. Helped 300+ students reach Band 7+." },
  { name: "Imran Hossain", email: "imran@mentorlagbe.com", role: "tutor", phone: "+8801711000004", bio: "BUET graduate specialising in Higher Math and Chemistry." },
  { name: "Rafi Chowdhury", email: "rafi@mentorlagbe.com", role: "student", phone: "+8801811000001", bio: "HSC candidate preparing for engineering admission." },
  { name: "Mim Akter", email: "mim@mentorlagbe.com", role: "student", phone: "+8801811000002", bio: "Class 10 student who loves science." },
  { name: "Sajid Karim", email: "sajid@mentorlagbe.com", role: "student", phone: "+8801811000003", bio: "Aspiring web developer." },
];

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

type Seed = Omit<TuitionDoc, "_id" | "createdAt" | "approvalStatus" | "isActive" | "tutorName"> & { approvalStatus?: TuitionDoc["approvalStatus"] };

const tuitions: Seed[] = [
  { title: "HSC Physics Complete Batch - Mechanics to Modern Physics", subject: "Physics", classLevel: "HSC", mode: "Offline", location: "Dhanmondi, Dhaka", monthlyFee: 3500, daysPerWeek: 3, tutorEmail: "farhana@mentorlagbe.com", bannerImage: img("photo-1636466497217-26a8cbeaf0aa"), description: "A structured HSC Physics batch covering the full syllabus with weekly model tests, doubt-solving sessions and problem-solving drills based on board questions." },
  { title: "Higher Math Mastery for HSC & Admission", subject: "Math", classLevel: "HSC", mode: "Online", location: "Online (Zoom)", monthlyFee: 3000, daysPerWeek: 4, tutorEmail: "imran@mentorlagbe.com", bannerImage: img("photo-1635070041078-e363dbe005cb"), description: "Concept-first teaching of Calculus, Vectors and Conics with recorded classes, weekly exams and personal feedback for every student." },
  { title: "Python & Problem Solving 1-on-1 Mentorship", subject: "Programming", classLevel: "University", mode: "Online", location: "Online (Google Meet)", monthlyFee: 5000, daysPerWeek: 3, tutorEmail: "tanvir@mentorlagbe.com", bannerImage: img("photo-1515879218367-8466d910aaa4"), description: "Go from zero to confident problem solver. Personal roadmap, code reviews, mock interviews and weekly projects with a working software engineer." },
  { title: "IELTS Academic - Band 7+ Intensive Course", subject: "IELTS", classLevel: "Admission", mode: "Online", location: "Online (Zoom)", monthlyFee: 4500, daysPerWeek: 3, tutorEmail: "nusrat@mentorlagbe.com", bannerImage: img("photo-1434030216411-0b793f4b4173"), description: "Targeted practice for Reading, Writing, Listening and Speaking with examiner-style feedback and full-length mock tests every weekend." },
  { title: "SSC Chemistry Foundation Batch", subject: "Chemistry", classLevel: "SSC", mode: "Offline", location: "Mirpur 10, Dhaka", monthlyFee: 2500, daysPerWeek: 3, tutorEmail: "imran@mentorlagbe.com", bannerImage: img("photo-1532094349884-543bc11b234d"), description: "Build a rock-solid foundation in SSC Chemistry with experiments explained simply, chapter-wise tests and exam-oriented notes." },
  { title: "Class 8 Science & Math Home Tutoring", subject: "Math", classLevel: "Class 8", mode: "Offline", location: "Uttara, Dhaka", monthlyFee: 2000, daysPerWeek: 5, tutorEmail: "farhana@mentorlagbe.com", bannerImage: img("photo-1503676260728-1c00da094a0b"), description: "Friendly home tutoring that makes Science and Math enjoyable, with daily homework support and monthly progress reports for parents." },
  { title: "Full-Stack Web Development with React & Node", subject: "Programming", classLevel: "University", mode: "Online", location: "Online (Discord + Meet)", monthlyFee: 6000, daysPerWeek: 3, tutorEmail: "tanvir@mentorlagbe.com", bannerImage: img("photo-1461749280684-dccba630e2f6"), description: "Learn to build real production apps. Weekly live coding, project reviews and career guidance. Portfolio-ready projects by the end of the course." },
  { title: "A-Level Physics (Edexcel & CAIE) Weekend Batch", subject: "Physics", classLevel: "A-Level", mode: "Online", location: "Online (Zoom)", monthlyFee: 5500, daysPerWeek: 2, tutorEmail: "farhana@mentorlagbe.com", bannerImage: img("photo-1507413245164-6160d8298b31"), description: "Weekend batch for A-Level Physics with past-paper walkthroughs, mark-scheme technique and a personal tutor for doubt clearing." },
  { title: "IELTS Speaking & Writing Crash Course", subject: "IELTS", classLevel: "Admission", mode: "Offline", location: "Gulshan, Dhaka", monthlyFee: 4000, daysPerWeek: 4, tutorEmail: "nusrat@mentorlagbe.com", bannerImage: img("photo-1456513080510-7bf3a84b82f8"), description: "A fast-paced four-week crash course focused on Speaking fluency and Writing Task 1 & 2 strategy, with live correction in every class." },
  { title: "HSC Chemistry Organic & Physical Special", subject: "Chemistry", classLevel: "HSC", mode: "Offline", location: "Mohammadpur, Dhaka", monthlyFee: 3200, daysPerWeek: 3, tutorEmail: "imran@mentorlagbe.com", bannerImage: img("photo-1603126857599-f462f1c8d1b2"), description: "Master reaction mechanisms and numerical problems in HSC Chemistry with short notes, tricks and regular revision exams." },
  { title: "English Spoken & Grammar for Class 6-8", subject: "English", classLevel: "Class 6", mode: "Online", location: "Online (Zoom)", monthlyFee: 1800, daysPerWeek: 3, tutorEmail: "nusrat@mentorlagbe.com", bannerImage: img("photo-1457369804613-52c61a468e7d"), description: "Interactive spoken English and grammar classes for young learners using stories, games and conversation practice to build confidence." },
  { title: "Data Structures & Algorithms Interview Prep", subject: "Programming", classLevel: "University", mode: "Online", location: "Online (Google Meet)", monthlyFee: 5200, daysPerWeek: 3, tutorEmail: "tanvir@mentorlagbe.com", bannerImage: img("photo-1555949963-ff9fe0c870eb"), description: "Pattern-based DSA preparation for product company interviews: arrays, graphs, DP and system design basics with mock interview rounds." },
  { title: "Biology Concept Clinic for SSC", subject: "Biology", classLevel: "SSC", mode: "Offline", location: "Banani, Dhaka", monthlyFee: 2200, daysPerWeek: 2, tutorEmail: "farhana@mentorlagbe.com", approvalStatus: "pending", bannerImage: img("photo-1530026405186-ed1f139313f8"), description: "Diagram-driven Biology classes that make memorising easy, with weekly quizzes and board-pattern question practice for SSC candidates." },
  { title: "Class 5 Bangla & English Home Tutor", subject: "English", classLevel: "Class 5", mode: "Offline", location: "Bashundhara R/A, Dhaka", monthlyFee: 1500, daysPerWeek: 5, tutorEmail: "nusrat@mentorlagbe.com", approvalStatus: "pending", bannerImage: img("photo-1503676260728-1c00da094a0b"), description: "Patient daily tutoring for primary students with reading practice, handwriting improvement and school homework support at home." },
];

async function createUser(p: (typeof people)[number]) {
  const existing = await Users.findOne({ email: p.email });
  if (!existing) {
    await auth.api.signUpEmail({ body: { name: p.name, email: p.email, password: PASSWORD } });
  }
  await Users.updateOne(
    { email: p.email },
    { $set: { role: p.role, plan: p.plan ?? "free", bio: p.bio, phone: p.phone, createdAt: new Date(Date.now() - Math.random() * 60 * 86400000) } },
  );
}

async function run() {
  console.log("Seeding MentorLagbe ...");
  for (const p of people) await createUser(p);

  await Tuitions.deleteMany({});
  await Applications.deleteMany({});
  const names = new Map(people.map((p) => [p.email, p.name]));

  const now = Date.now();
  const docs = tuitions.map((t, i) => ({
    ...t,
    tutorName: names.get(t.tutorEmail) ?? "Tutor",
    approvalStatus: t.approvalStatus ?? ("approved" as const),
    isActive: true,
    createdAt: new Date(now - i * 36 * 3600 * 1000),
  })) as TuitionDoc[];
  const { insertedIds } = await Tuitions.insertMany(docs);
  const ids = Object.values(insertedIds).map(String);

  const students = people.filter((p) => p.role === "student");
  const apps: Omit<ApplicationDoc, "_id">[] = [];
  const statuses: ApplicationDoc["status"][] = ["pending", "accepted", "rejected", "pending", "accepted"];
  students.forEach((s, si) => {
    [0, 2, 3, 6].slice(0, 3 + (si % 2)).forEach((ti, k) => {
      const t = docs[ti];
      apps.push({
        tuitionId: ids[ti],
        tuitionTitle: t.title,
        subject: t.subject,
        monthlyFee: t.monthlyFee,
        tutorEmail: t.tutorEmail,
        tutorName: t.tutorName,
        studentName: s.name,
        studentEmail: s.email,
        studentPhone: s.phone,
        preferredSchedule: k % 2 ? "Sat & Mon, 6:00 PM" : "Sun, Tue & Thu, 5:00 PM",
        studentNote: "I want to improve my fundamentals and prepare for upcoming exams.",
        status: statuses[(si + k) % statuses.length],
        appliedAt: new Date(now - (si + k + 1) * 24 * 3600 * 1000),
      });
    });
  });
  await Applications.insertMany(apps as ApplicationDoc[]);

  // Sample revenue records for the Pro tutors so the admin dashboard has data.
  await Payments.deleteMany({ stripeSessionId: /^cs_seed_/ });
  await Payments.insertMany(
    ["farhana@mentorlagbe.com", "tanvir@mentorlagbe.com"].map((email, i) => ({
      userEmail: email,
      userName: names.get(email)!,
      userRole: "tutor" as const,
      planName: "Pro Tutor",
      amount: 15,
      currency: "usd",
      transactionId: `pi_seed_${i + 1}`,
      stripeSessionId: `cs_seed_${i + 1}`,
      paymentStatus: "paid" as const,
      paidAt: new Date(now - (i + 2) * 86400000),
    })) as never[],
  );

  console.log(`Done. ${docs.length} tuitions, ${apps.length} applications, ${people.length} users.`);
  console.log(`Admin login: admin@mentorlagbe.com / ${PASSWORD}`);
  await client.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
