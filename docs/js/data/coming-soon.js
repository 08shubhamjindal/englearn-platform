// ============================================
// Coming Soon Papers — stub registrations
// ============================================
// These papers don't have content yet.
// When ready, create a full paper file (e.g., mapreduce-paper.js)
// with PaperRegistry.register() and remove the stub from here.

PaperRegistry.register(
  {
    id: 'mapreduce',
    title: 'Google MapReduce: Simplified Data Processing',
    source: 'Google, 2004 — OSDI Conference Paper',
    category: 'distributed',
    categoryLabel: 'Distributed Systems',
    description: 'The programming model that enabled Google to process massive datasets across thousands of machines. Understand the map and reduce paradigm, fault tolerance, and data locality.',
    chapters: 4,
    readTime: '18 min',
    difficulty: 'Beginner',
    originalLength: '~8,000 words',
    comingSoon: true,
    sortOrder: 10,
  },
  [] // No chapters yet
);

PaperRegistry.register(
  {
    id: 'spanner',
    title: 'Google Spanner: Globally Distributed Database',
    source: 'Google, 2012 — OSDI Conference Paper',
    category: 'database',
    categoryLabel: 'Database Systems',
    description: 'How Google built a globally distributed, strongly consistent database using TrueTime and synchronized clocks. Learn about external consistency and distributed transactions at scale.',
    chapters: 5,
    readTime: '22 min',
    difficulty: 'Advanced',
    originalLength: '~11,000 words',
    comingSoon: true,
    sortOrder: 11,
  },
  []
);

PaperRegistry.register(
  {
    id: 'tail-at-scale',
    title: 'The Tail at Scale — Jeff Dean & Luiz Barroso',
    source: 'Google, 2013 — Communications of the ACM',
    category: 'performance',
    categoryLabel: 'Performance Engineering',
    description: 'Why tail latency matters and how it amplifies in large-scale distributed systems. Learn techniques like hedged requests, tied requests, and micro-partitioning to tame tail latency.',
    chapters: 4,
    readTime: '15 min',
    difficulty: 'Intermediate',
    originalLength: '~6,000 words',
    comingSoon: true,
    sortOrder: 12,
  },
  []
);
