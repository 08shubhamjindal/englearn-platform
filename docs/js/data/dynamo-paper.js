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
        },
        {
          type: 'playground',
          title: '🧪 What If You Add Caching?',
          config: {
            architecture: {
              height: 180,
              nodes: [
                { id: 'client', label: 'Client', x: 90, y: 90, color: '#6366f1', width: 90, height: 36 },
                { id: 'web', label: 'Web Server', x: 270, y: 90, color: '#22d3ee', width: 110, height: 36 },
                { id: 'db', label: 'Primary DB', x: 500, y: 90, color: '#34d399', width: 100, height: 36 },
                { id: 'cdn', label: 'CDN Edge', x: 90, y: 30, color: '#fbbf24', width: 100, height: 32, requiresToggle: 'cdn' },
                { id: 'cache', label: 'Redis Cache', x: 390, y: 30, color: '#f87171', width: 110, height: 32, requiresToggle: 'redis' },
                { id: 'replica', label: 'Read Replica', x: 640, y: 90, color: '#a78bfa', width: 110, height: 36, requiresToggle: 'replica' },
              ],
              connections: [
                { from: 'client', to: 'web', label: 'request' },
                { from: 'web', to: 'db', label: 'query' },
                { from: 'client', to: 'cdn', label: 'static' },
                { from: 'web', to: 'cache', label: 'check' },
                { from: 'db', to: 'replica', label: 'sync', dashed: true },
                { from: 'web', to: 'replica', label: 'read' },
              ]
            },
            toggles: [
              { id: 'redis', label: 'Redis Cache', icon: '🔴' },
              { id: 'cdn', label: 'CDN', icon: '🌐' },
              { id: 'replica', label: 'Read Replica', icon: '📋' },
            ],
            defaultActive: [],
            baseInsight: 'Without caching, every request hits the database directly. This works at small scale but becomes a bottleneck as traffic grows. Try adding components to see the tradeoffs.',
            scenarios: {
              '_base': {
                metrics: [
                  { label: 'Latency', value: '~200ms', change: '' },
                  { label: 'Throughput', value: '~1K rps', change: '' },
                  { label: 'Complexity', value: 'Low', change: '' },
                  { label: 'Cost', value: '$', change: '' },
                ],
                insight: 'Without caching, every request hits the database directly. This works at small scale but becomes a bottleneck as traffic grows.'
              },
              'redis': {
                metrics: [
                  { label: 'Latency', value: '~15ms', change: 'better' },
                  { label: 'Throughput', value: '~10K rps', change: 'better' },
                  { label: 'Complexity', value: 'Medium', change: 'worse' },
                  { label: 'Cost', value: '$$', change: 'worse' },
                ],
                insight: 'Redis intercepts repeated reads — 90%+ cache hit rate cuts latency dramatically. But now you need cache invalidation logic. <strong>What happens when stale data is served?</strong> This is the classic cache invalidation problem.'
              },
              'cdn': {
                metrics: [
                  { label: 'Latency', value: '~120ms', change: 'better' },
                  { label: 'Throughput', value: '~2K rps', change: 'better' },
                  { label: 'Complexity', value: 'Low', change: '' },
                  { label: 'Cost', value: '$$', change: 'worse' },
                ],
                insight: 'CDN serves static assets from edge locations near users, slashing latency for images, CSS, and JS. But dynamic API responses still hit your server — CDN alone doesn\'t fix the DB bottleneck.'
              },
              'replica': {
                metrics: [
                  { label: 'Latency', value: '~180ms', change: 'better' },
                  { label: 'Throughput', value: '~2K rps', change: 'better' },
                  { label: 'Complexity', value: 'Medium', change: 'worse' },
                  { label: 'Cost', value: '$$', change: 'worse' },
                ],
                insight: 'Read replica offloads read queries from the primary, freeing it for writes. But there\'s <strong>replication lag</strong> — reads might return stale data. Sound familiar? That\'s eventual consistency — exactly what Dynamo embraces!'
              },
              'cdn+redis': {
                metrics: [
                  { label: 'Latency', value: '~10ms', change: 'better' },
                  { label: 'Throughput', value: '~15K rps', change: 'better' },
                  { label: 'Complexity', value: 'High', change: 'worse' },
                  { label: 'Cost', value: '$$$', change: 'worse' },
                ],
                insight: 'CDN handles static content, Redis handles dynamic data caching — a powerful combo. But now you have <strong>two caching layers to invalidate</strong>. When do you bust the CDN cache vs the Redis cache?'
              },
              'cdn+replica': {
                metrics: [
                  { label: 'Latency', value: '~100ms', change: 'better' },
                  { label: 'Throughput', value: '~4K rps', change: 'better' },
                  { label: 'Complexity', value: 'Medium', change: 'worse' },
                  { label: 'Cost', value: '$$$', change: 'worse' },
                ],
                insight: 'CDN for static files + read replica for DB reads. Good read scalability, but you still lack app-level caching for hot API responses. A common but incomplete architecture.'
              },
              'redis+replica': {
                metrics: [
                  { label: 'Latency', value: '~12ms', change: 'better' },
                  { label: 'Throughput', value: '~12K rps', change: 'better' },
                  { label: 'Complexity', value: 'High', change: 'worse' },
                  { label: 'Cost', value: '$$$', change: 'worse' },
                ],
                insight: 'Redis handles hot reads, replica handles cache misses — your primary DB only does writes now. Great throughput, but you must manage cache invalidation on writes AND handle replication lag on misses.'
              },
              'cdn+redis+replica': {
                metrics: [
                  { label: 'Latency', value: '~8ms', change: 'better' },
                  { label: 'Throughput', value: '~20K rps', change: 'better' },
                  { label: 'Complexity', value: 'Very High', change: 'worse' },
                  { label: 'Cost', value: '$$$$', change: 'worse' },
                ],
                insight: 'The full stack! CDN at the edge, Redis for API caching, read replica for DB reads. Amazing performance but <strong>significant operational complexity</strong>. This is why Dynamo solved the problem differently — with a decentralized architecture instead of layering caches.'
              }
            }
          }
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
          type: 'playground',
          title: '🧪 Tune the Quorum — What Happens?',
          config: {
            architecture: {
              height: 180,
              nodes: [
                { id: 'client', label: 'Client', x: 80, y: 90, color: '#6366f1', width: 90, height: 36 },
                { id: 'coord', label: 'Coordinator', x: 250, y: 90, color: '#22d3ee', width: 110, height: 36 },
                { id: 'n1', label: 'Node 1', x: 440, y: 30, color: '#34d399', width: 90, height: 36 },
                { id: 'n2', label: 'Node 2', x: 440, y: 90, color: '#34d399', width: 90, height: 36 },
                { id: 'n3', label: 'Node 3', x: 440, y: 150, color: '#34d399', width: 90, height: 36 },
                { id: 'n4', label: 'Node 4', x: 600, y: 60, color: '#fbbf24', width: 90, height: 36, requiresToggle: 'n5' },
                { id: 'n5', label: 'Node 5', x: 600, y: 120, color: '#fbbf24', width: 90, height: 36, requiresToggle: 'n5' },
              ],
              connections: [
                { from: 'client', to: 'coord', label: 'request' },
                { from: 'coord', to: 'n1' },
                { from: 'coord', to: 'n2' },
                { from: 'coord', to: 'n3' },
                { from: 'coord', to: 'n4', dashed: true },
                { from: 'coord', to: 'n5', dashed: true },
              ]
            },
            toggles: [
              { id: 'w1', label: 'W=1 (Fast Writes)', icon: '⚡' },
              { id: 'r1', label: 'R=1 (Fast Reads)', icon: '📖' },
              { id: 'n5', label: 'N=5 (More Replicas)', icon: '🔄' },
            ],
            defaultActive: [],
            baseInsight: 'Default: N=3, R=2, W=2. Since R+W (4) > N (3), reads always see the latest write — strong consistency. But every operation waits for 2 nodes. Try tuning the knobs!',
            scenarios: {
              '_base': {
                metrics: [
                  { label: 'Read Speed', value: '~10ms', change: '' },
                  { label: 'Write Speed', value: '~10ms', change: '' },
                  { label: 'Consistency', value: 'Strong', change: '' },
                  { label: 'Durability', value: 'Good', change: '' },
                ],
                insight: 'Default: N=3, R=2, W=2. Since R+W (4) > N (3), reads always see the latest write — strong consistency. But every operation waits for 2 nodes.'
              },
              'w1': {
                metrics: [
                  { label: 'Read Speed', value: '~10ms', change: '' },
                  { label: 'Write Speed', value: '~3ms', change: 'better' },
                  { label: 'Consistency', value: 'Eventual', change: 'worse' },
                  { label: 'Durability', value: 'Weak', change: 'worse' },
                ],
                insight: 'W=1: writes complete when ONE node confirms — 3× faster! But R+W (3) = N (3), so you might read stale data. If that single node crashes before replicating, <strong>the write is lost</strong>. Amazon uses this for the shopping cart — losing a write is better than losing a sale.'
              },
              'r1': {
                metrics: [
                  { label: 'Read Speed', value: '~3ms', change: 'better' },
                  { label: 'Write Speed', value: '~10ms', change: '' },
                  { label: 'Consistency', value: 'Eventual', change: 'worse' },
                  { label: 'Durability', value: 'Good', change: '' },
                ],
                insight: 'R=1: reads return from the fastest node — great for latency-sensitive workloads. But you might read from a node that hasn\'t received the latest write. <strong>User sees stale data.</strong> Acceptable for product catalogs, not for bank balances.'
              },
              'n5': {
                metrics: [
                  { label: 'Read Speed', value: '~10ms', change: '' },
                  { label: 'Write Speed', value: '~15ms', change: 'worse' },
                  { label: 'Consistency', value: 'Strong', change: '' },
                  { label: 'Durability', value: 'Excellent', change: 'better' },
                ],
                insight: 'N=5 replicas (R=2, W=2): data survives 3 simultaneous node failures. More durable, but writes go to 5 nodes instead of 3 — slower. Also <strong>5× storage cost</strong>. Worth it for critical data, overkill for session storage.'
              },
              'r1+w1': {
                metrics: [
                  { label: 'Read Speed', value: '~3ms', change: 'better' },
                  { label: 'Write Speed', value: '~3ms', change: 'better' },
                  { label: 'Consistency', value: 'Weak', change: 'worse' },
                  { label: 'Durability', value: 'Weak', change: 'worse' },
                ],
                insight: '⚠️ R=1, W=1 — blazing fast but dangerous! R+W (2) < N (3), so reads can easily miss recent writes. You write to Node A, read from Node C that hasn\'t replicated yet. Only use for data you can afford to lose (analytics, temp caches).'
              },
              'n5+w1': {
                metrics: [
                  { label: 'Read Speed', value: '~10ms', change: '' },
                  { label: 'Write Speed', value: '~3ms', change: 'better' },
                  { label: 'Consistency', value: 'Eventual', change: 'worse' },
                  { label: 'Durability', value: 'Good', change: '' },
                ],
                insight: 'N=5 + W=1: fast writes AND good eventual durability (5 copies). But R+W (3) < N (5), so reads may miss recent writes. This is similar to what DynamoDB offers as its default eventual consistency mode.'
              },
              'n5+r1': {
                metrics: [
                  { label: 'Read Speed', value: '~3ms', change: 'better' },
                  { label: 'Write Speed', value: '~15ms', change: 'worse' },
                  { label: 'Consistency', value: 'Eventual', change: 'worse' },
                  { label: 'Durability', value: 'Excellent', change: 'better' },
                ],
                insight: 'N=5 + R=1: fast reads from 5 geo-distributed replicas. Great for read-heavy workloads. But R+W (3) < N (5) — no strong consistency. The tradeoff is clear: <strong>more replicas help availability, not consistency</strong>.'
              },
              'n5+r1+w1': {
                metrics: [
                  { label: 'Read Speed', value: '~3ms', change: 'better' },
                  { label: 'Write Speed', value: '~3ms', change: 'better' },
                  { label: 'Consistency', value: 'Weak', change: 'worse' },
                  { label: 'Durability', value: 'Good', change: '' },
                ],
                insight: 'Maximum speed with N=5 as safety net. Fast reads AND writes, but weak consistency. The 5 replicas give durability via background sync. This is <strong>Dynamo\'s sweet spot for shopping cart data</strong> — always available, eventually consistent.'
              }
            }
          }
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
        },
        {
          type: 'playground',
          title: '🧪 Building Failure Resilience',
          config: {
            architecture: {
              height: 200,
              nodes: [
                { id: 'client', label: 'Client', x: 80, y: 100, color: '#6366f1', width: 90, height: 36 },
                { id: 'n1', label: 'Node A', x: 270, y: 40, color: '#22d3ee', width: 90, height: 36 },
                { id: 'n2', label: 'Node B', x: 270, y: 100, color: '#22d3ee', width: 90, height: 36 },
                { id: 'n3', label: 'Node C', x: 270, y: 160, color: '#22d3ee', width: 90, height: 36 },
                { id: 'gossip', label: 'Gossip Layer', x: 460, y: 40, color: '#fbbf24', width: 110, height: 32, requiresToggle: 'gossip' },
                { id: 'handoff', label: 'Standby Node', x: 460, y: 100, color: '#34d399', width: 110, height: 32, requiresToggle: 'handoff' },
                { id: 'merkle', label: 'Merkle Sync', x: 460, y: 160, color: '#a78bfa', width: 110, height: 32, requiresToggle: 'merkle' },
              ],
              connections: [
                { from: 'client', to: 'n1' },
                { from: 'client', to: 'n2' },
                { from: 'client', to: 'n3' },
                { from: 'n1', to: 'gossip', dashed: true },
                { from: 'n2', to: 'gossip', dashed: true },
                { from: 'n3', to: 'gossip', dashed: true },
                { from: 'n2', to: 'handoff', label: 'failover' },
                { from: 'n1', to: 'merkle', dashed: true },
                { from: 'n3', to: 'merkle', dashed: true },
              ]
            },
            toggles: [
              { id: 'gossip', label: 'Gossip Protocol', icon: '📡' },
              { id: 'handoff', label: 'Hinted Handoff', icon: '🔄' },
              { id: 'merkle', label: 'Merkle Trees', icon: '🌳' },
            ],
            defaultActive: [],
            baseInsight: 'A bare 3-node cluster with no failure handling. If Node B goes down, its data is unreachable and writes to its keys fail. No detection, no recovery. Try adding Dynamo\'s resilience mechanisms.',
            scenarios: {
              '_base': {
                metrics: [
                  { label: 'Detection', value: 'None', change: '' },
                  { label: 'Write Avail.', value: '67%', change: '' },
                  { label: 'Data Safety', value: 'At Risk', change: '' },
                  { label: 'Recovery', value: 'Manual', change: '' },
                ],
                insight: 'A bare 3-node cluster. If any node goes down, its data is unreachable and writes fail. No automatic detection, no recovery. You\'d need an operator to manually detect and fix the problem.'
              },
              'gossip': {
                metrics: [
                  { label: 'Detection', value: '~1s', change: 'better' },
                  { label: 'Write Avail.', value: '67%', change: '' },
                  { label: 'Data Safety', value: 'At Risk', change: '' },
                  { label: 'Recovery', value: 'Manual', change: '' },
                ],
                insight: 'Gossip protocol detects failures in ~1 second — each node exchanges heartbeats with random peers. Now you <strong>know</strong> a node is down, but you can\'t do anything about it yet. Detection without action.'
              },
              'handoff': {
                metrics: [
                  { label: 'Detection', value: 'None', change: '' },
                  { label: 'Write Avail.', value: '100%', change: 'better' },
                  { label: 'Data Safety', value: 'Buffered', change: 'better' },
                  { label: 'Recovery', value: 'Auto', change: 'better' },
                ],
                insight: 'Hinted handoff: when a node is unreachable, writes are sent to a standby with a "hint" — <em>deliver this to Node B when it\'s back</em>. Writes never fail! But without gossip, you rely on timeouts to detect the failure (slow).'
              },
              'merkle': {
                metrics: [
                  { label: 'Detection', value: 'None', change: '' },
                  { label: 'Write Avail.', value: '67%', change: '' },
                  { label: 'Data Safety', value: 'Synced', change: 'better' },
                  { label: 'Recovery', value: 'Background', change: 'better' },
                ],
                insight: 'Merkle trees let nodes compare data efficiently — compare one hash to check if millions of keys are in sync. Finds diverged keys in O(log n). <strong>But this only repairs data after the fact</strong> — it doesn\'t help during the failure itself.'
              },
              'gossip+handoff': {
                metrics: [
                  { label: 'Detection', value: '~1s', change: 'better' },
                  { label: 'Write Avail.', value: '100%', change: 'better' },
                  { label: 'Data Safety', value: 'Buffered', change: 'better' },
                  { label: 'Recovery', value: 'Auto', change: 'better' },
                ],
                insight: 'Now we\'re talking! Gossip detects failure fast, hinted handoff keeps writes flowing. The standby buffers data and delivers it when the failed node recovers. <strong>Zero downtime, zero lost writes.</strong> But what about data that diverged while the node was down?'
              },
              'gossip+merkle': {
                metrics: [
                  { label: 'Detection', value: '~1s', change: 'better' },
                  { label: 'Write Avail.', value: '67%', change: '' },
                  { label: 'Data Safety', value: 'Synced', change: 'better' },
                  { label: 'Recovery', value: 'Background', change: 'better' },
                ],
                insight: 'Gossip detects failures, Merkle trees repair diverged data after recovery. Good for data consistency, but writes still fail while the node is down — you\'re missing the hinted handoff piece for availability.'
              },
              'handoff+merkle': {
                metrics: [
                  { label: 'Detection', value: 'Slow', change: '' },
                  { label: 'Write Avail.', value: '100%', change: 'better' },
                  { label: 'Data Safety', value: 'Synced', change: 'better' },
                  { label: 'Recovery', value: 'Auto', change: 'better' },
                ],
                insight: 'Handoff keeps writes flowing, Merkle trees sync data after recovery. Strong combination! But without gossip\'s fast detection, you discover failures via slow timeouts. <strong>Detection speed matters</strong> — seconds vs minutes of degraded performance.'
              },
              'gossip+handoff+merkle': {
                metrics: [
                  { label: 'Detection', value: '~1s', change: 'better' },
                  { label: 'Write Avail.', value: '100%', change: 'better' },
                  { label: 'Data Safety', value: 'Synced', change: 'better' },
                  { label: 'Recovery', value: 'Full Auto', change: 'better' },
                ],
                insight: '🎯 <strong>This is Dynamo\'s full resilience stack!</strong> Gossip detects failures in seconds, hinted handoff ensures zero lost writes, Merkle trees repair any data divergence in the background. A fully self-healing system with no human intervention needed.'
              }
            }
          }
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
