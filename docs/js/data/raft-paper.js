// Raft Consensus Paper — self-registering
// To add a new paper, copy this file's structure and change the data.
// No other files need to be modified.

PaperRegistry.register(
  // ===== CATALOG METADATA =====
  {
    id: 'raft',
    title: 'Raft: Understandable Consensus Algorithm',
    source: 'Stanford, 2014 — USENIX ATC',
    category: 'consensus',
    categoryLabel: 'Consensus Protocol',
    description: 'How Raft solves distributed consensus in a way that\'s easier to understand than Paxos. Learn about leader election, log replication, and safety guarantees in distributed systems.',
    chapters: 5,
    readTime: '20 min',
    difficulty: 'Intermediate',
    originalLength: '~10,000 words',
    sortOrder: 2,
  },
  // ===== CHAPTERS =====
  [
    {
      id: 'ch1',
      number: 1,
      title: 'The Consensus Problem',
      subtitle: 'Why distributed systems need consensus and why Paxos was too hard to understand.',
      duration: '4 min',
      blocks: [
        {
          type: 'text',
          content: `<p>In any distributed system, multiple servers need to <strong>agree on shared state</strong>. If you have a replicated database, all replicas must apply the same updates in the same order. This is the <em>consensus problem</em>.</p>
<p>Before Raft, the gold standard was <strong>Paxos</strong>, developed by Leslie Lamport. Paxos is provably correct — but it's notoriously difficult to understand and implement correctly. Even experienced engineers struggle with its subtleties.</p>`
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 The Motivation',
          text: 'The Raft authors (Diego Ongaro & John Ousterhout at Stanford) ran studies showing students learned Raft significantly faster than Paxos. Understandability was a primary design goal — not just correctness.'
        },
        {
          type: 'text',
          content: `<p>Raft achieves the same safety guarantees as Paxos but decomposes the problem into three clearer sub-problems:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Leader Election</strong> — how to pick a single leader among servers',
            '<strong>Log Replication</strong> — how the leader distributes commands to followers',
            '<strong>Safety</strong> — ensuring logs never diverge and committed entries are never lost'
          ]
        },
        {
          type: 'diagram',
          diagramType: 'request-flow',
          title: 'Raft Server States',
          config: {
            nodes: [
              { id: 'follower', label: 'Follower', x: 160, y: 170, type: 'rect', color: '#34d399' },
              { id: 'candidate', label: 'Candidate', x: 400, y: 170, type: 'rect', color: '#fbbf24' },
              { id: 'leader', label: 'Leader', x: 640, y: 170, type: 'rect', color: '#6366f1' },
            ],
            edges: [
              { from: 'follower', to: 'candidate', label: 'Timeout, start election' },
              { from: 'candidate', to: 'leader', label: 'Gets majority votes' },
              { from: 'candidate', to: 'follower', label: 'Discovers leader / new term' },
              { from: 'leader', to: 'follower', label: 'Discovers higher term' },
            ],
            steps: [
              { highlight: ['follower'], edgeHighlight: [], text: 'All servers start as Followers. They passively listen for RPCs from the leader.' },
              { highlight: ['follower', 'candidate'], edgeHighlight: [0], text: 'If a follower doesn\'t hear from a leader within the election timeout, it becomes a Candidate.' },
              { highlight: ['candidate', 'leader'], edgeHighlight: [1], text: 'The candidate requests votes. If it gets a majority, it becomes the Leader for that term.' },
              { highlight: ['leader', 'follower'], edgeHighlight: [2, 3], text: 'If a candidate or leader discovers a higher term, it steps down to Follower. Only one leader per term.' },
            ]
          }
        }
      ]
    },
    {
      id: 'ch2',
      number: 2,
      title: 'Leader Election',
      subtitle: 'How Raft elects a single leader using randomized timeouts and majority voting.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Raft uses a <strong>strong leader</strong> model — all client requests go through the leader, who replicates commands to followers. This simplifies the design enormously compared to leaderless approaches.</p>
<p>Time is divided into <em>terms</em>, each with at most one leader. Terms act as a logical clock that helps servers detect stale information.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'request-flow',
          title: 'Leader Election Process',
          config: {
            nodes: [
              { id: 's1', label: 'Server 1\n(Candidate)', x: 130, y: 80, type: 'rect', color: '#fbbf24' },
              { id: 's2', label: 'Server 2', x: 390, y: 80, type: 'rect', color: '#34d399' },
              { id: 's3', label: 'Server 3', x: 650, y: 80, type: 'rect', color: '#34d399' },
              { id: 's4', label: 'Server 4', x: 260, y: 230, type: 'rect', color: '#34d399' },
              { id: 's5', label: 'Server 5', x: 520, y: 230, type: 'rect', color: '#64748b' },
            ],
            edges: [
              { from: 's1', to: 's2', label: 'RequestVote' },
              { from: 's1', to: 's3', label: 'RequestVote' },
              { from: 's1', to: 's4', label: 'RequestVote' },
              { from: 's1', to: 's5', label: 'RequestVote', dashed: true },
            ],
            steps: [
              { highlight: ['s1'], edgeHighlight: [], text: 'Server 1\'s election timeout expires (randomized 150-300ms). No heartbeat received. It increments its term and becomes a Candidate.' },
              { highlight: ['s1', 's2', 's3', 's4', 's5'], edgeHighlight: [0, 1, 2, 3], text: 'Server 1 sends RequestVote RPCs to all other servers, voting for itself first.' },
              { highlight: ['s1', 's2', 's4'], edgeHighlight: [0, 2], text: 'Servers 2 and 4 vote YES (they haven\'t voted yet this term and S1\'s log is up-to-date). Server 5 is down.' },
              { highlight: ['s1'], edgeHighlight: [], text: '✅ Server 1 has 3 votes (itself + S2 + S4) out of 5 = majority! It becomes Leader for this term and starts sending heartbeats.' },
            ]
          }
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '⚠️ Split Vote Problem',
          text: 'If two candidates start elections simultaneously, votes may split and neither gets a majority. Raft solves this with randomized election timeouts — each server waits a random duration (150-300ms) before starting an election, making simultaneous candidacies unlikely.'
        },
        {
          type: 'code',
          language: 'pseudocode',
          title: 'Election Timeout Logic',
          content: `<span class="keyword">function</span> <span class="function">onElectionTimeout</span>():
    currentTerm++
    role = CANDIDATE
    votedFor = self
    votesReceived = 1  <span class="comment">// vote for self</span>

    <span class="keyword">for</span> server <span class="keyword">in</span> cluster:
        <span class="function">sendRequestVote</span>(server, currentTerm, myLog)

    <span class="comment">// Reset with random timeout (150-300ms)</span>
    <span class="function">resetElectionTimer</span>(<span class="function">random</span>(150, 300))`
        }
      ]
    },
    {
      id: 'ch3',
      number: 3,
      title: 'Log Replication',
      subtitle: 'How the leader replicates client commands to followers and ensures consistency.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Once a leader is elected, it handles all client requests. Each request is appended to the leader's log as a new <strong>log entry</strong> with the current term number. The leader then replicates this entry to followers via <em>AppendEntries RPCs</em>.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'request-flow',
          title: 'Log Replication Flow',
          config: {
            nodes: [
              { id: 'client', label: 'Client', x: 60, y: 150, type: 'circle', color: '#6366f1' },
              { id: 'leader', label: 'Leader', x: 270, y: 150, type: 'rect', color: '#6366f1' },
              { id: 'f1', label: 'Follower 1', x: 520, y: 50, type: 'rect', color: '#34d399' },
              { id: 'f2', label: 'Follower 2', x: 520, y: 150, type: 'rect', color: '#34d399' },
              { id: 'f3', label: 'Follower 3', x: 520, y: 250, type: 'rect', color: '#34d399' },
              { id: 'f4', label: 'Follower 4', x: 520, y: 340, type: 'rect', color: '#64748b' },
            ],
            edges: [
              { from: 'client', to: 'leader', label: 'SET x=5' },
              { from: 'leader', to: 'f1', label: 'AppendEntries' },
              { from: 'leader', to: 'f2', label: 'AppendEntries' },
              { from: 'leader', to: 'f3', label: 'AppendEntries' },
              { from: 'leader', to: 'f4', label: 'AppendEntries', dashed: true },
            ],
            steps: [
              { highlight: ['client', 'leader'], edgeHighlight: [0], text: 'Client sends command "SET x=5". Leader appends it to its log at the next index.' },
              { highlight: ['leader', 'f1', 'f2', 'f3', 'f4'], edgeHighlight: [1, 2, 3, 4], text: 'Leader sends AppendEntries RPCs to all followers in parallel. Each includes the log entry and metadata.' },
              { highlight: ['f1', 'f2', 'f3'], edgeHighlight: [], text: 'Followers 1, 2, 3 append the entry and ACK. Follower 4 is slow/unreachable.' },
              { highlight: ['leader', 'client'], edgeHighlight: [], text: '✅ Majority (3 followers + leader = 4/5) confirmed. Entry is COMMITTED. Leader applies it and responds to client.' },
            ]
          }
        },
        {
          type: 'text',
          content: `<p>A log entry is <strong>committed</strong> once the leader has replicated it to a majority of servers. Once committed, the entry is guaranteed to be durable — it will eventually be applied by all servers.</p>`
        },
        {
          type: 'callout',
          variant: 'success',
          title: '✅ Log Matching Property',
          text: 'Raft guarantees: if two logs contain an entry with the same index and term, then (1) they store the same command, and (2) all preceding entries are identical. This is enforced by a consistency check in AppendEntries RPCs.'
        },
        {
          type: 'text',
          content: `<p>If a follower's log is inconsistent (e.g., it missed entries while it was down), the leader detects this and <em>backtracks</em> to find the latest matching entry, then overwrites the follower's log from that point forward.</p>`
        }
      ]
    },
    {
      id: 'ch4',
      number: 4,
      title: 'Safety Guarantees',
      subtitle: 'How Raft ensures that committed entries are never lost, even during leader changes.',
      duration: '4 min',
      blocks: [
        {
          type: 'text',
          content: `<p>The most critical property Raft must uphold: <strong>if a log entry is committed, it must appear in the logs of all future leaders</strong>. Without this, client data could be lost during leader transitions.</p>`
        },
        {
          type: 'heading',
          content: 'Election Restriction'
        },
        {
          type: 'text',
          content: `<p>Raft enforces this through the <em>election restriction</em>: a candidate cannot win an election unless its log is at least as up-to-date as a majority of servers' logs.</p>
<p>When voting, a server compares the candidate's last log entry with its own. It rejects the vote if the candidate's log is behind. Since a committed entry exists on a majority, any winning candidate must have it.</p>`
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Why This Works',
          text: 'A committed entry is on a majority (e.g., 3 of 5). A candidate needs a majority to win (3 of 5). Any two majorities overlap in at least one server. So the candidate must contact at least one server that has the committed entry — and will only win if its own log includes it too.'
        },
        {
          type: 'heading',
          content: 'Committing Entries from Previous Terms'
        },
        {
          type: 'text',
          content: `<p>A subtle case: when a new leader takes over, it may find uncommitted entries from previous leaders. Raft does NOT commit these by counting replicas — it only commits entries from the <em>current term</em>. Previous-term entries get committed indirectly when a current-term entry after them is committed.</p>`
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '⚠️ This is a Subtle Bug Source',
          text: 'Many Raft implementations get this wrong. Directly committing a previous leader\'s entry based on replica count can lead to committed entries being overwritten. Only commit entries from the current term — previous entries are committed implicitly.'
        }
      ]
    },
    {
      id: 'ch5',
      number: 5,
      title: 'Impact & Practical Applications',
      subtitle: 'Where Raft is used in production and what made it succeed over Paxos.',
      duration: '3 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Raft has become the <strong>most widely adopted consensus algorithm in modern infrastructure</strong>. Its understandability made it practical to implement correctly.</p>`
        },
        {
          type: 'heading',
          content: 'Production Systems Using Raft'
        },
        {
          type: 'list',
          items: [
            '<strong>etcd</strong> — the distributed key-value store used by Kubernetes for all cluster state. Every Kubernetes cluster runs Raft.',
            '<strong>CockroachDB</strong> — a distributed SQL database that uses Raft for replicating transaction logs across nodes.',
            '<strong>TiKV / TiDB</strong> — a distributed database from PingCAP using Raft for consistent replication.',
            '<strong>Consul</strong> — HashiCorp\'s service discovery tool uses Raft for leadership and state consistency.',
            '<strong>MongoDB (since 3.2)</strong> — MongoDB\'s replica set protocol is inspired by Raft principles.'
          ]
        },
        {
          type: 'heading',
          content: 'Why Raft Won'
        },
        {
          type: 'callout',
          variant: 'success',
          title: '✅ Understandability is a Feature',
          text: 'The #1 reason Raft succeeded: engineers could implement it correctly. Paxos has fewer production implementations not because it\'s less capable, but because it\'s harder to get right. In distributed systems, a correctly implemented simple algorithm beats an incorrectly implemented optimal one.'
        },
        {
          type: 'diagram',
          diagramType: 'architecture-stack',
          title: 'Raft Architecture Summary',
          config: {
            nodes: [
              { id: 'l1', label: 'Client Requests', x: 390, y: 40, type: 'rect', color: '#6366f1', width: 460 },
              { id: 'l2', label: 'Leader Election (Randomized Timeouts)', x: 390, y: 100, type: 'rect', color: '#fbbf24', width: 460 },
              { id: 'l3', label: 'Log Replication (AppendEntries RPC)', x: 390, y: 160, type: 'rect', color: '#22d3ee', width: 460 },
              { id: 'l4', label: 'Safety (Election Restriction + Commit Rules)', x: 390, y: 220, type: 'rect', color: '#34d399', width: 460 },
              { id: 'l5', label: 'State Machine (Apply Committed Entries)', x: 390, y: 280, type: 'rect', color: '#a78bfa', width: 460 },
            ],
            edges: [],
            steps: [
              { highlight: ['l1', 'l2'], text: 'Clients send commands to the leader. If the leader fails, a new one is elected via majority vote.' },
              { highlight: ['l3'], text: 'The leader replicates log entries to followers. An entry is committed once a majority confirms.' },
              { highlight: ['l4'], text: 'Safety rules ensure committed entries survive leader changes. No data loss.' },
              { highlight: ['l5'], text: 'Each server applies committed entries to its state machine in order. All servers converge to identical state.' },
            ]
          }
        },
        {
          type: 'text',
          content: `<p>Raft proved that <strong>clarity and correctness can coexist</strong> in distributed systems design. Its decomposition into leader election, log replication, and safety makes it teachable, implementable, and verifiable — which is exactly what production systems need.</p>`
        }
      ]
    }
  ]
);
