// Amazon Dynamo Paper — self-registering
// To add a new paper, copy this file's structure and change the data.
// No other files need to be modified.

PaperRegistry.register(
  // ===== CATALOG METADATA =====
  {
    id: 'dynamo',
    title: 'Amazon Dynamo: Highly Available Key-Value Store',
    source: 'Amazon, 2007 — SOSP Conference Paper',
    category: 'distributed',
    categoryLabel: 'Distributed Systems',
    description: 'How Amazon built a highly available, eventually consistent key-value store that powers core services like the shopping cart. Learn about consistent hashing, vector clocks, sloppy quorums, and anti-entropy protocols.',
    chapters: 5,
    readTime: '25 min',
    difficulty: 'Intermediate',
    originalLength: '~12,000 words',
    sortOrder: 1,
  },
  // ===== CHAPTERS =====
  [
    // ============ CHAPTER 1 ============
    {
      id: 'ch1',
      number: 1,
      title: 'The Problem: Why Dynamo Was Built',
      subtitle: 'Understanding Amazon\'s availability crisis and why traditional databases failed at their scale.',
      duration: '4 min',
      blocks: [
        {
          type: 'text',
          content: `<p>In the mid-2000s, Amazon was growing at an unprecedented rate. Their services needed to handle <strong>millions of requests per second</strong> with extremely low latency. A single page render on amazon.com involved calls to <em>over 150 internal services</em>.</p>
<p>The critical requirement was simple: <strong>the shopping cart must always be available</strong>. A customer should always be able to add items and checkout — even during server failures, network partitions, or data center outages.</p>
<p>Traditional relational databases couldn't meet this need. They prioritized <em>consistency over availability</em>, meaning during network failures, the system would reject writes rather than risk inconsistency.</p>`
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 The Business Insight',
          text: 'Amazon calculated that every 100ms of added latency cost them 1% in sales. Downtime was even worse. This made availability the #1 priority — above even data consistency.'
        },
        {
          type: 'diagram',
          diagramType: 'request-flow',
          title: 'Amazon\'s Service Architecture',
          config: {
            nodes: [
              { id: 'user', label: 'Customer', x: 390, y: 30, type: 'circle', color: '#6366f1' },
              { id: 'web', label: 'Web Server', x: 390, y: 120, type: 'rect', color: '#22d3ee' },
              { id: 'cart', label: 'Cart Service', x: 180, y: 220, type: 'rect', color: '#34d399' },
              { id: 'rec', label: 'Recommendation', x: 390, y: 220, type: 'rect', color: '#34d399' },
              { id: 'order', label: 'Order Service', x: 600, y: 220, type: 'rect', color: '#34d399' },
              { id: 'db1', label: 'Database', x: 180, y: 330, type: 'rect', color: '#f87171' },
              { id: 'db2', label: 'Database', x: 390, y: 330, type: 'rect', color: '#f87171' },
              { id: 'db3', label: 'Database', x: 600, y: 330, type: 'rect', color: '#f87171' },
            ],
            edges: [
              { from: 'user', to: 'web', label: 'Request' },
              { from: 'web', to: 'cart', label: '' },
              { from: 'web', to: 'rec', label: '' },
              { from: 'web', to: 'order', label: '' },
              { from: 'cart', to: 'db1', label: '' },
              { from: 'rec', to: 'db2', label: '' },
              { from: 'order', to: 'db3', label: '' },
            ],
            steps: [
              { highlight: ['user', 'web'], edgeHighlight: [0], text: 'A customer visits amazon.com. The request hits a web server.' },
              { highlight: ['web', 'cart', 'rec', 'order'], edgeHighlight: [1, 2, 3], text: 'The web server fans out to 150+ microservices in parallel — cart, recommendations, orders, etc.' },
              { highlight: ['cart', 'db1', 'rec', 'db2', 'order', 'db3'], edgeHighlight: [4, 5, 6], text: 'Each service queries its own database. If ANY database is unavailable, the entire page render can fail.' },
              { highlight: ['db1'], edgeHighlight: [], text: '⚠️ Problem: Traditional DBs reject writes during failures. The shopping cart becomes unavailable.' },
            ]
          }
        },
        {
          type: 'text',
          content: `<p>Amazon needed a new type of data store — one that was:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Always writable</strong> — never reject a write, even during failures',
            '<strong>Highly available</strong> — 99.9th percentile latency under control',
            '<strong>Scalable</strong> — incrementally scalable by adding nodes',
            '<strong>Decentralized</strong> — no single point of failure, no master node'
          ]
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '⚠️ The CAP Trade-off',
          text: 'Dynamo chose Availability + Partition Tolerance (AP), sacrificing strong Consistency. This means during network partitions, Dynamo allows conflicting writes and resolves them later — a fundamental design choice that shapes its entire architecture.'
        }
      ]
    },
    // ============ CHAPTER 2 ============
    {
      id: 'ch2',
      number: 2,
      title: 'Consistent Hashing: Data Distribution',
      subtitle: 'How Dynamo distributes data across nodes without a central coordinator.',
      duration: '6 min',
      blocks: [
        {
          type: 'text',
          content: `<p>The first challenge Dynamo solves is: <strong>how do you decide which node stores a particular piece of data?</strong></p>
<p>A naive approach — like <code>hash(key) % N</code> — breaks completely when nodes are added or removed. Nearly all keys get remapped, causing massive data movement.</p>
<p>Dynamo uses <em>Consistent Hashing</em> instead, which minimizes data redistribution when the cluster changes.</p>`
        },
        {
          type: 'heading',
          content: 'How Consistent Hashing Works'
        },
        {
          type: 'text',
          content: `<p>Imagine a circular ring of hash values from 0 to 2<sup>128</sup>. Both <strong>nodes</strong> and <strong>data keys</strong> are hashed onto this ring. Each key is assigned to the first node encountered when walking clockwise from the key's position.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'hash-ring',
          title: 'Consistent Hashing Ring',
          config: {
            nodes: [
              { id: 'a', label: 'Node A', angle: 30, type: 'circle', color: '#6366f1' },
              { id: 'b', label: 'Node B', angle: 120, type: 'circle', color: '#22d3ee' },
              { id: 'c', label: 'Node C', angle: 210, type: 'circle', color: '#34d399' },
              { id: 'd', label: 'Node D', angle: 300, type: 'circle', color: '#fbbf24' },
            ],
            keys: [
              { id: 'k1', label: 'key-1', angle: 50, assignedTo: 'b' },
              { id: 'k2', label: 'key-2', angle: 160, assignedTo: 'c' },
              { id: 'k3', label: 'key-3', angle: 250, assignedTo: 'd' },
              { id: 'k4', label: 'key-4', angle: 340, assignedTo: 'a' },
            ],
            steps: [
              { highlight: ['a', 'b', 'c', 'd'], text: 'Nodes are hashed onto a circular ring. Each node is responsible for a range of the ring.' },
              { highlight: ['k1', 'b'], text: 'key-1 hashes to position 50°. Walking clockwise, it finds Node B at 120° → Node B stores key-1.' },
              { highlight: ['k2', 'c'], text: 'key-2 hashes to position 160°. Walking clockwise, it finds Node C at 210° → Node C stores key-2.' },
              { highlight: ['k3', 'k4', 'd', 'a'], text: 'Similarly, key-3 → Node D and key-4 → Node A. Each node handles its arc of the ring.' },
              { highlight: ['a', 'b', 'c', 'd'], text: '✅ When a node is added/removed, only keys in its arc move — the rest stay in place. Minimal disruption!' },
            ]
          }
        },
        {
          type: 'heading',
          content: 'Virtual Nodes (Vnodes)'
        },
        {
          type: 'text',
          content: `<p>A problem with basic consistent hashing is <strong>uneven load distribution</strong>. With few physical nodes, the arcs can be very unequal.</p>
<p>Dynamo solves this with <em>virtual nodes</em>: each physical node gets multiple positions on the ring. A powerful machine gets more virtual nodes, a smaller machine gets fewer.</p>`
        },
        {
          type: 'callout',
          variant: 'success',
          title: '✅ Virtual Nodes Benefits',
          text: 'Virtual nodes spread data more evenly, enable proportional load based on hardware capacity, and make it faster to rebuild data when a node fails (the load is spread across many remaining nodes instead of one).'
        },
        {
          type: 'code',
          language: 'pseudocode',
          title: 'Key Assignment Logic',
          content: `<span class="keyword">function</span> <span class="function">getResponsibleNode</span>(key):
    hash = <span class="function">md5</span>(key)
    position = hash <span class="keyword">mod</span> RING_SIZE

    <span class="comment">// Walk clockwise to find first node</span>
    <span class="keyword">for</span> node <span class="keyword">in</span> ring.clockwiseFrom(position):
        <span class="keyword">if</span> node.isAlive():
            <span class="keyword">return</span> node

    <span class="comment">// Wrap around the ring</span>
    <span class="keyword">return</span> ring.first()`
        }
      ]
    },
    // ============ CHAPTER 3 ============
    {
      id: 'ch3',
      number: 3,
      title: 'Replication & Conflict Resolution',
      subtitle: 'How Dynamo replicates data for durability and handles conflicting writes using vector clocks.',
      duration: '6 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Storing data on a single node isn't enough — if that node fails, the data is lost. Dynamo <strong>replicates each key to N nodes</strong> (typically N=3) for durability and availability.</p>
<p>The coordinator node (the node responsible for a key) replicates the data to the <em>next N-1 nodes</em> on the hash ring, called <strong>preference list</strong> nodes.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'replication-flow',
          title: 'Replication Strategy (N=3)',
          config: {
            nodes: [
              { id: 'client', label: 'Client', x: 60, y: 170, type: 'circle', color: '#6366f1' },
              { id: 'coord', label: 'Coordinator\n(Node A)', x: 280, y: 170, type: 'rect', color: '#22d3ee' },
              { id: 'rep1', label: 'Replica 1\n(Node B)', x: 500, y: 70, type: 'rect', color: '#34d399' },
              { id: 'rep2', label: 'Replica 2\n(Node C)', x: 500, y: 170, type: 'rect', color: '#34d399' },
              { id: 'rep3', label: 'Replica 3\n(Node D)', x: 500, y: 270, type: 'rect', color: '#64748b' },
            ],
            edges: [
              { from: 'client', to: 'coord', label: 'PUT(key, val)' },
              { from: 'coord', to: 'rep1', label: 'Replicate' },
              { from: 'coord', to: 'rep2', label: 'Replicate' },
              { from: 'coord', to: 'rep3', label: 'Replicate', dashed: true },
            ],
            steps: [
              { highlight: ['client', 'coord'], edgeHighlight: [0], text: 'Client sends a PUT request. The coordinator (Node A) receives it based on consistent hashing.' },
              { highlight: ['coord', 'rep1', 'rep2'], edgeHighlight: [1, 2], text: 'Coordinator replicates to N-1 = 2 more nodes (B, C). With W=2 (write quorum), it waits for 1 more ACK.' },
              { highlight: ['rep1', 'rep2'], edgeHighlight: [], text: 'Once W nodes (including coordinator) confirm the write, the client gets a success response. Fast!' },
              { highlight: ['rep3'], edgeHighlight: [3], text: 'Node D is a "hinted handoff" target — used if B or C are temporarily down. Ensures availability.' },
            ]
          }
        },
        {
          type: 'heading',
          content: 'Sloppy Quorum & Hinted Handoff'
        },
        {
          type: 'text',
          content: `<p>Dynamo uses a <em>sloppy quorum</em> — instead of requiring the exact N designated nodes to participate, it can use any healthy node as a temporary stand-in. This is called <strong>hinted handoff</strong>.</p>
<p>When a replica node is down, the write is sent to another node with a "hint" that says "this data actually belongs to node X — please send it there when X recovers."</p>`
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 The Quorum Parameters',
          text: 'Dynamo uses three configurable parameters: N (replicas), R (read quorum), W (write quorum). As long as R + W > N, you get strong consistency. Dynamo typically uses N=3, R=2, W=2 — but can be tuned. Setting W=1 gives fastest writes but weaker durability.'
        },
        {
          type: 'heading',
          content: 'Vector Clocks: Resolving Conflicts'
        },
        {
          type: 'text',
          content: `<p>Because Dynamo is "always writable," two clients can update the same key on different nodes simultaneously — creating <strong>conflicting versions</strong>.</p>
<p>Dynamo uses <em>vector clocks</em> to track causality. A vector clock is a list of (node, counter) pairs that records which nodes have updated the value and how many times.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'timeline',
          title: 'Vector Clock Conflict Example',
          config: {
            nodes: [
              { id: 'vc1', label: 'D1 [(A,1)]', x: 150, y: 60, type: 'rect', color: '#6366f1' },
              { id: 'vc2', label: 'D2 [(A,1),(B,1)]', x: 390, y: 60, type: 'rect', color: '#22d3ee' },
              { id: 'vc3', label: 'D3 [(A,1),(C,1)]', x: 390, y: 200, type: 'rect', color: '#34d399' },
              { id: 'vc4', label: 'D4 [(A,1),(B,1),(C,1)]', x: 620, y: 130, type: 'rect', color: '#fbbf24' },
            ],
            edges: [
              { from: 'vc1', to: 'vc2', label: 'Node B writes' },
              { from: 'vc1', to: 'vc3', label: 'Node C writes' },
              { from: 'vc2', to: 'vc4', label: 'Merge' },
              { from: 'vc3', to: 'vc4', label: 'Merge' },
            ],
            steps: [
              { highlight: ['vc1'], edgeHighlight: [], text: 'Node A writes key with initial vector clock [(A,1)]. This creates version D1.' },
              { highlight: ['vc1', 'vc2', 'vc3'], edgeHighlight: [0, 1], text: 'Node B and C both update the key concurrently. D2 and D3 are created — these are CONFLICTING versions.' },
              { highlight: ['vc2', 'vc3'], edgeHighlight: [], text: 'Neither D2 nor D3 "wins" — their vector clocks show independent, concurrent updates (no causal order).' },
              { highlight: ['vc4'], edgeHighlight: [2, 3], text: 'On the next read, the client receives BOTH versions and must resolve the conflict (e.g., merge shopping carts).' },
            ]
          }
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '⚠️ Application-Level Resolution',
          text: 'Dynamo pushes conflict resolution to the application. For a shopping cart, if two versions exist, Amazon merges them (union of items). This is a deliberate design choice — the system never silently drops a write.'
        }
      ]
    },
    // ============ CHAPTER 4 ============
    {
      id: 'ch4',
      number: 4,
      title: 'Failure Handling & Anti-Entropy',
      subtitle: 'How Dynamo detects failures, recovers data, and keeps replicas synchronized.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>In a distributed system with hundreds of nodes, <strong>failures are the norm, not the exception</strong>. Dynamo is designed to handle them gracefully without any downtime.</p>`
        },
        {
          type: 'heading',
          content: 'Gossip-Based Failure Detection'
        },
        {
          type: 'text',
          content: `<p>There is no central monitor. Instead, every node periodically gossips — it picks a random peer and exchanges membership information. If a node hasn't been heard from in a while, it's marked as temporarily unreachable.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'gossip-protocol',
          title: 'Gossip Protocol: Failure Detection',
          config: {
            nodes: [
              { id: 'g1', label: 'Node A', x: 200, y: 80, type: 'circle', color: '#6366f1' },
              { id: 'g2', label: 'Node B', x: 400, y: 80, type: 'circle', color: '#22d3ee' },
              { id: 'g3', label: 'Node C', x: 580, y: 80, type: 'circle', color: '#34d399' },
              { id: 'g4', label: 'Node D', x: 120, y: 230, type: 'circle', color: '#fbbf24' },
              { id: 'g5', label: 'Node E', x: 300, y: 270, type: 'circle', color: '#f87171' },
              { id: 'g6', label: 'Node F', x: 500, y: 230, type: 'circle', color: '#a78bfa' },
            ],
            edges: [
              { from: 'g1', to: 'g2', label: 'gossip', dashed: true },
              { from: 'g2', to: 'g6', label: 'gossip', dashed: true },
              { from: 'g3', to: 'g1', label: 'gossip', dashed: true },
              { from: 'g4', to: 'g5', label: 'gossip', dashed: true },
            ],
            steps: [
              { highlight: ['g1', 'g2'], edgeHighlight: [0], text: 'Every second, each node randomly picks a peer and exchanges membership info. A → B: "Here\'s who I know about."' },
              { highlight: ['g2', 'g6'], edgeHighlight: [1], text: 'B then gossips with F. Information propagates like an epidemic — quickly reaching all nodes.' },
              { highlight: ['g5'], edgeHighlight: [], text: '⚠️ If Node E stops gossiping, other nodes will notice and mark it as "suspected down" after a timeout.' },
              { highlight: ['g1', 'g2', 'g3', 'g4', 'g6'], edgeHighlight: [], text: 'Once detected, the cluster routes around E. Hinted handoff stores E\'s data on other nodes temporarily.' },
            ]
          }
        },
        {
          type: 'heading',
          content: 'Merkle Trees: Anti-Entropy Repair'
        },
        {
          type: 'text',
          content: `<p>Over time, replicas can diverge due to missed updates, failures, or network issues. Dynamo uses <strong>Merkle trees</strong> (hash trees) to efficiently detect and repair inconsistencies.</p>
<p>Each node maintains a Merkle tree over its key range. To sync with a replica, two nodes compare their tree roots — if they match, the data is identical. If not, they traverse down the tree to find exactly which keys differ.</p>`
        },
        {
          type: 'callout',
          variant: 'success',
          title: '✅ Why Merkle Trees Are Efficient',
          text: 'Without Merkle trees, syncing would require comparing every single key-value pair (O(n)). With Merkle trees, nodes first compare a single hash (the root). If it matches, zero data transfer needed. If not, they narrow down to the exact differing keys in O(log n) comparisons.'
        },
        {
          type: 'text',
          content: `<p>This combination of gossip protocol (for failure detection) and Merkle trees (for data repair) gives Dynamo a fully decentralized, self-healing architecture with <strong>no single point of failure</strong>.</p>`
        }
      ]
    },
    // ============ CHAPTER 5 ============
    {
      id: 'ch5',
      number: 5,
      title: 'Real-World Impact & Lessons',
      subtitle: 'How Dynamo influenced modern distributed systems and what we can learn from its design.',
      duration: '4 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Dynamo was a landmark paper that shifted how the industry thinks about distributed data stores. Its ideas directly inspired some of the most widely used databases today.</p>`
        },
        {
          type: 'heading',
          content: 'Systems Inspired by Dynamo'
        },
        {
          type: 'list',
          items: [
            '<strong>Apache Cassandra</strong> — combines Dynamo\'s partitioning (consistent hashing) with Bigtable\'s column-family data model. Used at Netflix, Apple, Instagram.',
            '<strong>Amazon DynamoDB</strong> — a fully managed evolution of Dynamo, now one of AWS\'s core services.',
            '<strong>Riak</strong> — a database built directly on Dynamo\'s design principles, including sloppy quorum and vector clocks.',
            '<strong>Voldemort</strong> — LinkedIn\'s key-value store, heavily inspired by Dynamo\'s architecture.'
          ]
        },
        {
          type: 'heading',
          content: 'Key Design Lessons'
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Lesson 1: Business Requirements Drive Architecture',
          text: 'Dynamo\'s "always writable" design came directly from Amazon\'s business need — never lose a sale. The CAP trade-off (choosing AP over CP) was a business decision, not just a technical one.'
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Lesson 2: Embrace Eventual Consistency',
          text: 'Strong consistency is expensive in distributed systems. Many applications (shopping carts, session stores, user preferences) can tolerate brief inconsistency. Dynamo proved this at scale.'
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Lesson 3: Decentralization Enables Scale',
          text: 'By eliminating master nodes and central coordinators, Dynamo avoids single points of failure and bottlenecks. Every node is equal — any node can serve any request.'
        },
        {
          type: 'heading',
          content: 'Summary: Dynamo\'s Architecture Stack'
        },
        {
          type: 'diagram',
          diagramType: 'architecture-stack',
          title: 'Dynamo Complete Architecture',
          config: {
            nodes: [
              { id: 'layer1', label: 'Client Request Layer', x: 390, y: 40, type: 'rect', color: '#6366f1', width: 460 },
              { id: 'layer2', label: 'Consistent Hashing (Data Partitioning)', x: 390, y: 100, type: 'rect', color: '#22d3ee', width: 460 },
              { id: 'layer3', label: 'Replication (N=3, Sloppy Quorum)', x: 390, y: 160, type: 'rect', color: '#34d399', width: 460 },
              { id: 'layer4', label: 'Vector Clocks (Conflict Resolution)', x: 390, y: 220, type: 'rect', color: '#fbbf24', width: 460 },
              { id: 'layer5', label: 'Gossip Protocol (Failure Detection)', x: 390, y: 280, type: 'rect', color: '#f87171', width: 460 },
              { id: 'layer6', label: 'Merkle Trees (Anti-Entropy Sync)', x: 390, y: 340, type: 'rect', color: '#a78bfa', width: 460 },
            ],
            edges: [],
            steps: [
              { highlight: ['layer1', 'layer2'], text: 'A client request arrives. Consistent hashing determines which node is responsible (O(1) lookup).' },
              { highlight: ['layer3'], text: 'The coordinator replicates to N-1 nodes. Sloppy quorum ensures availability even if some replicas are down.' },
              { highlight: ['layer4'], text: 'Vector clocks track causality. Conflicts from concurrent writes are detected and resolved.' },
              { highlight: ['layer5', 'layer6'], text: 'Background processes: gossip detects failures, Merkle trees repair diverged replicas. Self-healing.' },
            ]
          }
        },
        {
          type: 'text',
          content: `<p>Dynamo demonstrated that it's possible to build a <strong>highly available, scalable, decentralized storage system</strong> — if you're willing to accept eventual consistency and push conflict resolution to the application layer.</p>
<p>This paper remains essential reading for anyone building or working with distributed systems.</p>`
        }
      ]
    }
  ]
);
