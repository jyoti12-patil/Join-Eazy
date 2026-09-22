import bcrypt from 'bcryptjs';
import prisma from './config/db.js';

async function main() {
  console.log('🌱 Starting database seeding for JoinEazy...');

  // Clean existing records in reverse dependency order
  await prisma.submission.deleteMany({});
  await prisma.assignmentGroup.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.courseEnrollment.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Professor (Admin)
  const professor = await prisma.user.create({
    data: {
      name: 'Dr. Evelyn Reed',
      email: 'professor@joineazy.edu',
      password: defaultPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created Professor: ${professor.email} (password123)`);

  // 2. Create Students
  const alex = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'alex@joineazy.edu',
      studentId: 'STU-1001',
      password: defaultPassword,
      role: 'STUDENT',
    },
  });

  const maria = await prisma.user.create({
    data: {
      name: 'Maria Rodriguez',
      email: 'maria@joineazy.edu',
      studentId: 'STU-1002',
      password: defaultPassword,
      role: 'STUDENT',
    },
  });

  const david = await prisma.user.create({
    data: {
      name: 'David Kim',
      email: 'david@joineazy.edu',
      studentId: 'STU-1003',
      password: defaultPassword,
      role: 'STUDENT',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah@joineazy.edu',
      studentId: 'STU-1004',
      password: defaultPassword,
      role: 'STUDENT',
    },
  });

  const james = await prisma.user.create({
    data: {
      name: 'James Wilson',
      email: 'james@joineazy.edu',
      studentId: 'STU-1005',
      password: defaultPassword,
      role: 'STUDENT',
    },
  });

  const emily = await prisma.user.create({
    data: {
      name: 'Emily Zhang',
      email: 'emily@joineazy.edu',
      studentId: 'STU-1006',
      password: defaultPassword,
      role: 'STUDENT',
    },
  });
  console.log('✅ Created 6 Students: alex, maria, david, sarah, james, emily');

  // 3. Create Courses
  const course1 = await prisma.course.create({
    data: {
      name: 'Advanced Distributed Systems',
      code: 'CS-601',
      description: 'Deep dive into distributed computing paradigms, consensus algorithms, and fault-tolerant system design. Covers Raft, Paxos, CRDTs, and modern distributed databases.',
      professorId: professor.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Cloud Computing Architecture',
      code: 'CS-602',
      description: 'Comprehensive study of cloud-native architectures, microservices patterns, container orchestration with Kubernetes, and serverless computing paradigms.',
      professorId: professor.id,
    },
  });
  console.log('✅ Created 2 Courses: Advanced Distributed Systems (CS-601) and Cloud Computing Architecture (CS-602)');

  // 4. Enroll students into courses
  const allStudents = [alex, maria, david, sarah, james, emily];
  for (const student of allStudents) {
    await prisma.courseEnrollment.create({
      data: { courseId: course1.id, studentId: student.id },
    });
  }
  // Enroll only some students in course2
  for (const student of [alex, maria, david, sarah]) {
    await prisma.courseEnrollment.create({
      data: { courseId: course2.id, studentId: student.id },
    });
  }
  console.log('✅ Enrolled students into courses (all in CS-601, 4 in CS-602)');

  // 5. Create Groups
  const group1 = await prisma.group.create({
    data: {
      name: 'Quantum Coders',
      createdById: alex.id,
      maxMembers: 5,
      members: {
        create: [
          { userId: alex.id, role: 'LEADER' },
          { userId: maria.id, role: 'MEMBER' },
          { userId: david.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const group2 = await prisma.group.create({
    data: {
      name: 'Nexus Innovators',
      createdById: sarah.id,
      maxMembers: 4,
      members: {
        create: [
          { userId: sarah.id, role: 'LEADER' },
          { userId: james.id, role: 'MEMBER' },
        ],
      },
    },
  });
  console.log('✅ Created 2 Groups: Quantum Coders and Nexus Innovators (Emily unassigned)');

  // 6. Create Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'Assignment 1: Distributed Database Replication',
      description:
        'Implement Raft-based distributed replication protocol using Go or Node.js. Upload your final source repository, design document, and benchmark analysis video to OneDrive.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      onedriveLink: 'https://onedrive.live.com/view.aspx?cid=joineazy-distrib-db-101',
      isGlobal: true,
      submissionType: 'GROUP',
      createdById: professor.id,
      courseId: course1.id,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: 'Assignment 2: Cloud Native Microservices Architecture',
      description:
        'Architect a resilient microservice system with event-driven message queuing, API Gateway routing, and observability dashboards. Include load testing metrics.',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      onedriveLink: 'https://onedrive.live.com/view.aspx?cid=joineazy-microservices-202',
      isGlobal: true,
      submissionType: 'GROUP',
      createdById: professor.id,
      courseId: course2.id,
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      title: 'Assignment 3: AI Model Inference Optimization (Honors)',
      description:
        'Special honor track project for selected groups: optimize model weights quantization and ONNX runtime latency for edge deployment.',
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      onedriveLink: 'https://onedrive.live.com/view.aspx?cid=joineazy-honors-ai-303',
      isGlobal: false,
      submissionType: 'GROUP',
      createdById: professor.id,
      courseId: course1.id,
      assignmentGroups: {
        create: [{ groupId: group1.id }],
      },
    },
  });

  const assignment4 = await prisma.assignment.create({
    data: {
      title: 'Assignment 4: Individual Research Paper Review',
      description:
        'Read and write a critical review of the assigned research paper on distributed consensus algorithms. This is an individual submission — each student submits their own review.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      onedriveLink: 'https://onedrive.live.com/view.aspx?cid=joineazy-paper-review-404',
      isGlobal: true,
      submissionType: 'INDIVIDUAL',
      createdById: professor.id,
      courseId: course1.id,
    },
  });
  console.log('✅ Created 4 Assignments (3 GROUP, 1 INDIVIDUAL) with OneDrive links');

  // 7. Create Sample Submissions
  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      groupId: group1.id,
      submittedById: alex.id,
      confirmed: true,
      acknowledgedByLeader: true,
      leaderAcknowledgedAt: new Date(),
      submissionNote: 'Uploaded full zip archive and benchmark metrics to OneDrive.',
      confirmedAt: new Date(),
    },
  });

  // Individual submission sample
  await prisma.submission.create({
    data: {
      assignmentId: assignment4.id,
      groupId: null,
      submittedById: alex.id,
      confirmed: true,
      submissionNote: 'Submitted my critical review PDF on Raft consensus.',
      confirmedAt: new Date(),
    },
  });
  console.log('✅ Created sample submissions (1 group confirmed, 1 individual confirmed)');

  console.log('🎉 Seeding complete!');
  console.log('\n--- Test Accounts ---');
  console.log('Professor: professor@joineazy.edu / password123');
  console.log('Student (Group Leader): alex@joineazy.edu / password123');
  console.log('Student (Unassigned): emily@joineazy.edu / password123');
  console.log('\n--- Courses ---');
  console.log(`CS-601: Advanced Distributed Systems (${course1.id})`);
  console.log(`CS-602: Cloud Computing Architecture (${course2.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
