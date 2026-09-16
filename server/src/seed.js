import bcrypt from 'bcryptjs';
import prisma from './config/db.js';

async function main() {
  console.log('🌱 Starting database seeding for JoinEazy...');

  // Clean existing records in reverse dependency order
  await prisma.submission.deleteMany({});
  await prisma.assignmentGroup.deleteMany({});
  await prisma.assignment.deleteMany({});
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

  // 3. Create Groups
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

  // 4. Create Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'Assignment 1: Distributed Database Replication',
      description:
        'Implement Raft-based distributed replication protocol using Go or Node.js. Upload your final source repository, design document, and benchmark analysis video to OneDrive.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days ahead
      onedriveLink: 'https://onedrive.live.com/view.aspx?cid=joineazy-distrib-db-101',
      isGlobal: true,
      createdById: professor.id,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: 'Assignment 2: Cloud Native Microservices Architecture',
      description:
        'Architect a resilient microservice system with event-driven message queuing, API Gateway routing, and observability dashboards. Include load testing metrics.',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days ahead
      onedriveLink: 'https://onedrive.live.com/view.aspx?cid=joineazy-microservices-202',
      isGlobal: true,
      createdById: professor.id,
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      title: 'Assignment 3: AI Model Inference Optimization (Honors)',
      description:
        'Special honor track project for selected groups: optimize model weights quantization and ONNX runtime latency for edge deployment.',
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days ahead
      onedriveLink: 'https://onedrive.live.com/view.aspx?cid=joineazy-honors-ai-303',
      isGlobal: false,
      createdById: professor.id,
      assignmentGroups: {
        create: [{ groupId: group1.id }],
      },
    },
  });
  console.log('✅ Created 3 Assignments with OneDrive links');

  // 5. Create Sample Submission
  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      groupId: group1.id,
      submittedById: alex.id,
      confirmed: true,
      submissionNote: 'Uploaded full zip archive and benchmark metrics to OneDrive.',
      confirmedAt: new Date(),
    },
  });
  console.log('✅ Created sample confirmed submission for Quantum Coders on Assignment 1');

  console.log('🎉 Seeding complete!');
  console.log('\n--- Test Accounts ---');
  console.log('Professor: professor@joineazy.edu / password123');
  console.log('Student (Group Leader): alex@joineazy.edu / password123');
  console.log('Student (Unassigned): emily@joineazy.edu / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
