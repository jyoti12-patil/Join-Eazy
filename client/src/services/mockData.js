// Initial mock data mirroring the PostgreSQL database schema
export const initialMockData = {
  users: [
    {
      id: 'usr-prof-1',
      name: 'Dr. Evelyn Reed',
      email: 'professor@joineazy.edu',
      studentId: null,
      role: 'ADMIN',
    },
    {
      id: 'usr-stu-1',
      name: 'Alex Chen',
      email: 'alex@joineazy.edu',
      studentId: 'STU-1001',
      role: 'STUDENT',
    },
    {
      id: 'usr-stu-2',
      name: 'Maria Rodriguez',
      email: 'maria@joineazy.edu',
      studentId: 'STU-1002',
      role: 'STUDENT',
    },
    {
      id: 'usr-stu-3',
      name: 'David Kim',
      email: 'david@joineazy.edu',
      studentId: 'STU-1003',
      role: 'STUDENT',
    },
    {
      id: 'usr-stu-4',
      name: 'Sarah Connor',
      email: 'sarah@joineazy.edu',
      studentId: 'STU-1004',
      role: 'STUDENT',
    },
    {
      id: 'usr-stu-5',
      name: 'James Wilson',
      email: 'james@joineazy.edu',
      studentId: 'STU-1005',
      role: 'STUDENT',
    },
    {
      id: 'usr-stu-6',
      name: 'Emily Zhang',
      email: 'emily@joineazy.edu',
      studentId: 'STU-1006',
      role: 'STUDENT',
    },
  ],

  groups: [
    {
      id: 'grp-1',
      name: 'Quantum Coders',
      code: 'QC-789',
      createdById: 'usr-stu-1',
      maxMembers: 5,
      createdAt: '2026-09-10T10:00:00Z',
      members: [
        {
          id: 'gm-1',
          groupId: 'grp-1',
          userId: 'usr-stu-1',
          role: 'LEADER',
          joinedAt: '2026-09-10T10:00:00Z',
          user: { id: 'usr-stu-1', name: 'Alex Chen', email: 'alex@joineazy.edu', studentId: 'STU-1001' },
        },
        {
          id: 'gm-2',
          groupId: 'grp-1',
          userId: 'usr-stu-2',
          role: 'MEMBER',
          joinedAt: '2026-09-10T11:30:00Z',
          user: { id: 'usr-stu-2', name: 'Maria Rodriguez', email: 'maria@joineazy.edu', studentId: 'STU-1002' },
        },
        {
          id: 'gm-3',
          groupId: 'grp-1',
          userId: 'usr-stu-3',
          role: 'MEMBER',
          joinedAt: '2026-09-11T09:15:00Z',
          user: { id: 'usr-stu-3', name: 'David Kim', email: 'david@joineazy.edu', studentId: 'STU-1003' },
        },
      ],
    },
    {
      id: 'grp-2',
      name: 'Nexus Innovators',
      code: 'NI-412',
      createdById: 'usr-stu-4',
      maxMembers: 4,
      createdAt: '2026-09-12T14:20:00Z',
      members: [
        {
          id: 'gm-4',
          groupId: 'grp-2',
          userId: 'usr-stu-4',
          role: 'LEADER',
          joinedAt: '2026-09-12T14:20:00Z',
          user: { id: 'usr-stu-4', name: 'Sarah Connor', email: 'sarah@joineazy.edu', studentId: 'STU-1004' },
        },
        {
          id: 'gm-5',
          groupId: 'grp-2',
          userId: 'usr-stu-5',
          role: 'MEMBER',
          joinedAt: '2026-09-12T15:00:00Z',
          user: { id: 'usr-stu-5', name: 'James Wilson', email: 'james@joineazy.edu', studentId: 'STU-1005' },
        },
      ],
    },
  ],

  assignments: [
    {
      id: 'asg-1',
      title: 'Assignment 1: Distributed Database Replication',
      description:
        'Implement Raft-based consensus and distributed replication protocol. Submit your complete source repository, design specifications, and benchmark report to the provided OneDrive folder.',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      onedriveLink: 'https://onedrive.live.com/?id=joineazy-distrib-db-101&authkey=!AOx9281',
      isGlobal: true,
      createdById: 'usr-prof-1',
      createdAt: '2026-09-08T09:00:00Z',
      assignmentGroups: [],
    },
    {
      id: 'asg-2',
      title: 'Assignment 2: Cloud Native Microservices Architecture',
      description:
        'Architect a scalable microservices ecosystem using event-driven communication (RabbitMQ/Kafka), an API Gateway, and Docker containerization. OneDrive link contains starter configs.',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      onedriveLink: 'https://onedrive.live.com/?id=joineazy-microservices-202&authkey=!BKy4412',
      isGlobal: true,
      createdById: 'usr-prof-1',
      createdAt: '2026-09-11T12:00:00Z',
      assignmentGroups: [],
    },
    {
      id: 'asg-3',
      title: 'Assignment 3: Machine Learning Model Quantization (Honors Track)',
      description:
        'Special honor track assignment for select performance engineering groups. Benchmark INT8 vs FP16 ONNX inference throughput.',
      dueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      onedriveLink: 'https://onedrive.live.com/?id=joineazy-honors-ai-303&authkey=!CMz9923',
      isGlobal: false,
      createdById: 'usr-prof-1',
      createdAt: '2026-09-14T08:30:00Z',
      assignmentGroups: [{ groupId: 'grp-1', groupName: 'Quantum Coders' }],
    },
  ],

  submissions: [
    {
      id: 'sub-1',
      assignmentId: 'asg-1',
      groupId: 'grp-1',
      submittedById: 'usr-stu-1',
      confirmed: true,
      submissionNote: 'Uploaded final zip archive, report PDF, and Docker compose files to OneDrive folder.',
      submittedAt: '2026-09-14T16:45:00Z',
      confirmedAt: '2026-09-14T16:45:30Z',
      submittedBy: {
        id: 'usr-stu-1',
        name: 'Alex Chen',
        email: 'alex@joineazy.edu',
      },
    },
  ],
};
