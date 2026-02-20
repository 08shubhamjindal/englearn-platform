// Uber Docstore Paper — self-registering
// Based on: "Docstore: A Purpose-Built Transactional Database" — Uber Engineering Blog

PaperRegistry.register(
  // ===== CATALOG METADATA =====
  {
    id: 'docstore',
    title: 'Uber Docstore: From Schemaless to Transactional Database',
    source: 'Uber Engineering, 2020 — Engineering Blog',
    category: 'database',
    categoryLabel: 'Database Systems',
    description: 'How Uber evolved their append-only Schemaless datastore into Docstore — a general-purpose, horizontally scalable transactional database with strict serializability, Raft consensus, materialized views, and flexible document modeling.',
    chapters: 7,
    readTime: '35 min',
    difficulty: 'Advanced',
    originalLength: '~5,000 words',
    sortOrder: 3,
  },
  // ===== CHAPTERS =====
  [
    // ============ CHAPTER 1: Origin Story ============
    {
      id: 'ch1',
      number: 1,
      title: 'The Origin Story: Why Docstore Was Born',
      subtitle: 'How Schemaless and Cassandra both fell short, and why Uber needed a new database.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Every database at Uber's scale tells a story of trade-offs. To understand Docstore, you need to understand the two systems that came before it — and why neither was enough.</p>`
        },
        {
          type: 'heading',
          text: 'Act 1: Schemaless — The Append-Only Pioneer'
        },
        {
          type: 'text',
          content: `<p>In 2014, Uber built <strong>Schemaless</strong> — a custom datastore designed for high reliability. Its core design principle was radical simplicity: <em>make everything immutable</em>.</p>
<p>The smallest unit of data in Schemaless was called a <strong>cell</strong>. Once written, a cell could never be modified or deleted. If you wanted to "update" data, you'd write a new cell with a higher version number. The application would read the latest version.</p>
<p>This append-only design had real advantages:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>No data corruption</strong> — you can\'t corrupt data you can\'t modify',
            '<strong>Simple replication</strong> — just replay the append log on replicas',
            '<strong>Built-in audit trail</strong> — every version of every record is preserved',
            '<strong>No locking needed</strong> — concurrent writes never conflict since they\'re all appends'
          ]
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Why Immutability?',
          text: 'Removing mutability is one of the most powerful simplifications in system design. If data never changes, you eliminate entire categories of bugs: dirty reads, lost updates, write-write conflicts, and cascading rollbacks. Schemaless proved this — it was one of Uber\'s most reliable systems.'
        },
        {
          type: 'text',
          content: `<p>But over time, the limitations became painful. Schemaless had a very <strong>restrictive API</strong> — it could only do key-value lookups. No range queries. No secondary indexes. No transactions across cells. No updates or deletes. Every application that needed these features had to build workarounds in application code.</p>
<p>Developers were spending weeks building what should have been built-in database features.</p>`
        },
        {
          type: 'heading',
          text: 'Act 2: Cassandra — Flexibility Without Maturity'
        },
        {
          type: 'text',
          content: `<p>To address Schemaless's limitations, Uber adopted <strong>Apache Cassandra</strong>. Cassandra offered what Schemaless didn't: rich query capabilities, secondary indexes, and flexible data modeling.</p>
<p>But Cassandra brought its own set of problems at Uber's scale:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Operational immaturity</strong> — at Uber\'s data footprint (petabytes), operational issues became frequent and hard to debug',
            '<strong>Resource inefficiency</strong> — Cassandra\'s storage engine wasn\'t optimized for Uber\'s read-heavy workloads',
            '<strong>Eventual consistency</strong> — the biggest problem. Cassandra guarantees that replicas will <em>eventually</em> converge, but doesn\'t guarantee <em>when</em>'
          ]
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '⚠️ The Eventual Consistency Tax',
          text: 'With eventual consistency, a write to replica A may not be visible on replica B for seconds or even minutes. This means developers must handle stale reads, write conflicts, and ordering anomalies in application code. At Uber, this "consistency tax" was slowing down every team that used Cassandra.'
        },
        {
          type: 'diagram',
          diagramType: 'evolution',
          title: 'The Evolution: Schemaless → Cassandra → Docstore',
          config: {
            nodes: [
              { id: 'schema', label: 'Schemaless\n(2014)', x: 120, y: 150, type: 'rect', color: '#64748b' },
              { id: 'cass', label: 'Cassandra\n(2016)', x: 390, y: 150, type: 'rect', color: '#f59e0b' },
              { id: 'doc', label: 'Docstore\n(2018)', x: 660, y: 150, type: 'rect', color: '#6366f1' },
              { id: 'p1', label: 'Reliable but\nRestrictive', x: 120, y: 280, type: 'rect', color: '#374151' },
              { id: 'p2', label: 'Flexible but\nInconsistent', x: 390, y: 280, type: 'rect', color: '#374151' },
              { id: 'p3', label: 'Reliable +\nFlexible + Consistent', x: 660, y: 280, type: 'rect', color: '#374151' },
            ],
            edges: [
              { from: 'schema', to: 'cass', label: 'Need flexibility' },
              { from: 'cass', to: 'doc', label: 'Need consistency' },
              { from: 'schema', to: 'p1', label: '' },
              { from: 'cass', to: 'p2', label: '' },
              { from: 'doc', to: 'p3', label: '' },
            ],
            steps: [
              { highlight: ['schema', 'p1'], edgeHighlight: [2], text: 'Schemaless (2014): Uber\'s first custom datastore. Append-only cells, immutable, highly reliable — but only supported key-value lookups. No queries, no transactions.' },
              { highlight: ['schema', 'cass', 'p2'], edgeHighlight: [0, 3], text: 'Cassandra (2016): Adopted for flexibility — rich queries, secondary indexes. But eventual consistency caused bugs, and it was operationally expensive at Uber\'s scale.' },
              { highlight: ['cass', 'doc', 'p3'], edgeHighlight: [1, 4], text: 'Docstore (2018): Uber evolved Schemaless into a full transactional database — combining Schemaless\'s reliability with rich queries and strict consistency.' },
            ]
          }
        },
        {
          type: 'heading',
          text: 'Act 3: The Decision — Evolve, Don\'t Replace'
        },
        {
          type: 'text',
          content: `<p>The Uber database team had a choice: build something entirely new, adopt another open-source database, or <strong>evolve Schemaless</strong> into what they needed.</p>
<p>They chose evolution. Schemaless had already proven its reliability over years of production use. Its core storage layer was battle-tested. Rather than throw it away, they decided to add the missing features on top:</p>`
        },
        {
          type: 'list',
          items: [
            'Mutable rows with <strong>transactions</strong> (ACID semantics)',
            '<strong>Strong consistency</strong> via Raft consensus protocol',
            '<strong>Flexible schema</strong> — schema-on-write with evolution support',
            '<strong>Rich queries</strong> — materialized views, associations, CDC',
            '<strong>Horizontal scalability</strong> — transparent sharding and replication'
          ]
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Lesson: Evolution > Revolution',
          text: 'Uber didn\'t build a new database from scratch. They evolved a proven system. This is a key pattern in production systems engineering — incremental improvement of battle-tested code is often safer and faster than a full rewrite.'
        }
      ]
    },

    // ============ CHAPTER 2: Design Philosophy ============
    {
      id: 'ch2',
      number: 2,
      title: 'Design Philosophy: Best of Both Worlds',
      subtitle: 'How Docstore combines document flexibility with relational schema enforcement.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Docstore's central design insight is that <strong>schema flexibility and schema enforcement are not opposites</strong> — you can have both. This section explains the design philosophy that makes this possible.</p>`
        },
        {
          type: 'heading',
          text: 'Schema-on-Read vs. Schema-on-Write'
        },
        {
          type: 'text',
          content: `<p>There are two fundamental approaches to how databases handle data structure:</p>
<p><strong>Schema-on-Read</strong> (used by MongoDB, most NoSQL): Store data in any shape. The application interprets the structure when it reads the data. This is like dumping everything into a filing cabinet and sorting it when you need it.</p>
<p><strong>Schema-on-Write</strong> (used by MySQL, PostgreSQL): Define the structure upfront. The database validates every write against the schema. This is like having labeled folders — you can only file documents in the right place.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'schema-comparison',
          title: 'Schema-on-Read vs. Schema-on-Write',
          config: {
            nodes: [
              { id: 'app', label: 'Application', x: 390, y: 40, type: 'circle', color: '#6366f1' },
              { id: 'sor_write', label: 'Write\n(Any Shape)', x: 170, y: 140, type: 'rect', color: '#f59e0b' },
              { id: 'sow_write', label: 'Write\n(Validated)', x: 610, y: 140, type: 'rect', color: '#34d399' },
              { id: 'sor_db', label: 'Schema-on-Read\nDB', x: 170, y: 250, type: 'rect', color: '#f59e0b' },
              { id: 'sow_db', label: 'Schema-on-Write\nDB', x: 610, y: 250, type: 'rect', color: '#34d399' },
              { id: 'sor_read', label: 'Read\n(App Parses)', x: 170, y: 360, type: 'rect', color: '#f87171' },
              { id: 'sow_read', label: 'Read\n(Guaranteed Shape)', x: 610, y: 360, type: 'rect', color: '#22d3ee' },
            ],
            edges: [
              { from: 'app', to: 'sor_write', label: 'No validation' },
              { from: 'app', to: 'sow_write', label: 'Schema check' },
              { from: 'sor_write', to: 'sor_db', label: '' },
              { from: 'sow_write', to: 'sow_db', label: '' },
              { from: 'sor_db', to: 'sor_read', label: '' },
              { from: 'sow_db', to: 'sow_read', label: '' },
            ],
            steps: [
              { highlight: ['app', 'sor_write', 'sor_db'], edgeHighlight: [0, 2], text: 'Schema-on-Read: The application writes data in any shape. No validation at write time. Fast and flexible, but risky — bad data gets in.' },
              { highlight: ['sor_db', 'sor_read'], edgeHighlight: [4], text: 'On read, the application must parse and validate the data itself. If the shape changed or is corrupted, the app crashes or returns wrong results.' },
              { highlight: ['app', 'sow_write', 'sow_db'], edgeHighlight: [1, 3], text: 'Schema-on-Write: The database validates every write against a defined schema. Bad data is rejected immediately — you learn about errors at write time, not read time.' },
              { highlight: ['sow_db', 'sow_read'], edgeHighlight: [5], text: 'On read, the data is guaranteed to match the schema. The application can trust the structure without defensive parsing. This is what Docstore chose.' },
            ]
          }
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Why Schema-on-Write Wins at Scale',
          text: 'At Uber\'s scale, hundreds of teams write to shared databases. Schema-on-read means any team can write malformed data that breaks every consumer. Schema-on-write catches these errors immediately at the source. The cost of validation is tiny compared to the cost of debugging bad data across 100 downstream services.'
        },
        {
          type: 'heading',
          text: 'The Flexible Document Model'
        },
        {
          type: 'text',
          content: `<p>But Docstore didn't just copy relational schemas. They added crucial flexibility:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Schema evolution</strong> — add new columns, change types, without rebuilding the entire table. New and old rows coexist seamlessly.',
            '<strong>Sparse columns</strong> — not every row needs every column. Unlike rigid relational tables, columns can be absent.',
            '<strong>Nested data types</strong> — User Defined Types (UDTs) allow rows to contain deeply nested structures, like a JSON document but with schema validation.',
            '<strong>No downtime migrations</strong> — schema changes are applied online. No "maintenance window" needed.'
          ]
        },
        {
          type: 'text',
          content: `<p>This combination is what Uber calls the <strong>Flexible Document Model</strong>. It supports two data modeling patterns:</p>
<p><strong>1. Relational model:</strong> Traditional rows and columns with relationships via Associations (one-to-many, many-to-many).</p>
<p><strong>2. Hierarchical/document model:</strong> Entire nested documents stored as a single row using UDTs — useful when the whole object is always loaded together (like a user profile with nested addresses, payment methods, etc.).</p>`
        },
        {
          type: 'callout',
          variant: 'info',
          title: '📦 Real-World Example',
          text: 'A rider\'s trip record might contain: trip ID, timestamps, route (nested list of lat/lng points), fare breakdown (nested object with base fare, surge, taxes), and payment info. In a relational DB, this would be 4+ tables with JOINs. In Docstore, it\'s one row with nested UDTs — but still schema-validated.'
        },
        {
          type: 'heading',
          text: 'Feature Set at a Glance'
        },
        {
          type: 'text',
          content: `<p>Docstore ships with a rich feature set out of the box:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Transactions</strong> — full ACID semantics on a partition level',
            '<strong>Materialized Views</strong> — pre-computed views for different query access patterns',
            '<strong>Associations</strong> — built-in support for one-to-many and many-to-many relationships',
            '<strong>Change Data Capture (CDC)</strong> — stream of all changes for downstream consumers',
            '<strong>Single-click provisioning</strong> — integrated with Uber\'s infrastructure for instant setup'
          ]
        }
      ]
    },

    // ============ CHAPTER 3: Architecture ============
    {
      id: 'ch3',
      number: 3,
      title: 'Architecture: The Three Layers',
      subtitle: 'Query engine, storage engine, and control plane — how they work together.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Docstore uses a <strong>layered architecture</strong>. Each Docstore deployment is called an <em>instance</em>, and every instance is divided into three distinct layers, each with a clear responsibility.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'architecture-layers',
          title: 'Docstore Layered Architecture',
          config: {
            nodes: [
              { id: 'client', label: 'Application', x: 390, y: 30, type: 'circle', color: '#6366f1' },
              { id: 'qe1', label: 'Query\nEngine 1', x: 200, y: 130, type: 'rect', color: '#22d3ee' },
              { id: 'qe2', label: 'Query\nEngine 2', x: 390, y: 130, type: 'rect', color: '#22d3ee' },
              { id: 'qe3', label: 'Query\nEngine 3', x: 580, y: 130, type: 'rect', color: '#22d3ee' },
              { id: 'cp', label: 'Control Plane', x: 680, y: 260, type: 'rect', color: '#f59e0b' },
              { id: 'p1', label: 'Partition 1', x: 170, y: 260, type: 'rect', color: '#34d399' },
              { id: 'p2', label: 'Partition 2', x: 340, y: 260, type: 'rect', color: '#34d399' },
              { id: 'p3', label: 'Partition 3', x: 510, y: 260, type: 'rect', color: '#34d399' },
              { id: 's1', label: 'Shards\n1-100', x: 170, y: 370, type: 'rect', color: '#374151' },
              { id: 's2', label: 'Shards\n101-200', x: 340, y: 370, type: 'rect', color: '#374151' },
              { id: 's3', label: 'Shards\n201-300', x: 510, y: 370, type: 'rect', color: '#374151' },
            ],
            edges: [
              { from: 'client', to: 'qe1', label: '' },
              { from: 'client', to: 'qe2', label: 'Requests' },
              { from: 'client', to: 'qe3', label: '' },
              { from: 'qe2', to: 'p1', label: '' },
              { from: 'qe2', to: 'p2', label: 'Route' },
              { from: 'qe2', to: 'p3', label: '' },
              { from: 'p1', to: 's1', label: '' },
              { from: 'p2', to: 's2', label: '' },
              { from: 'p3', to: 's3', label: '' },
              { from: 'cp', to: 'p1', label: '' },
              { from: 'cp', to: 'p2', label: 'Manages' },
              { from: 'cp', to: 'p3', label: '' },
            ],
            steps: [
              { highlight: ['client', 'qe1', 'qe2', 'qe3'], edgeHighlight: [0, 1, 2], text: 'Layer 1 — Query Engine: Stateless nodes that receive application requests. They parse queries, validate schemas, and route requests to the correct partition. Being stateless means they can scale horizontally by just adding more nodes.' },
              { highlight: ['p1', 'p2', 'p3', 's1', 's2', 's3'], edgeHighlight: [6, 7, 8], text: 'Layer 2 — Storage Engine: Organized as partitions, each owning a set of shards. Data is distributed across shards. Each partition is a replicated group of 3-5 nodes running Raft consensus for strong consistency.' },
              { highlight: ['cp', 'p1', 'p2', 'p3'], edgeHighlight: [9, 10, 11], text: 'Layer 3 — Control Plane: The brain of the system. It assigns shards to partitions and dynamically rebalances shard placement in response to failures, hotspots, or capacity changes.' },
              { highlight: ['client', 'qe2', 'p2', 's2'], edgeHighlight: [1, 4, 7], text: 'Full request flow: App → Query Engine (stateless routing) → correct Partition (based on partition key) → Shard (data storage). The app never needs to know about shards or partitions.' },
            ]
          }
        },
        {
          type: 'heading',
          text: 'The Query Engine Layer (Stateless)'
        },
        {
          type: 'text',
          content: `<p>The query engine layer sits between the application and the storage layer. Its job is to:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Parse requests</strong> — understand what the application is asking for',
            '<strong>Validate schemas</strong> — ensure writes conform to the table schema (schema-on-write enforcement)',
            '<strong>Route to partitions</strong> — use the partition key to determine which partition holds the data',
            '<strong>Aggregate results</strong> — for queries that span multiple partitions, collect and merge results'
          ]
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Why Stateless Matters',
          text: 'Because query engine nodes hold no data, they can be added or removed at any time. If one crashes, traffic is simply routed to another. This makes the query layer trivially horizontally scalable — just add more nodes when traffic increases.'
        },
        {
          type: 'heading',
          text: 'The Storage Engine Layer (Stateful)'
        },
        {
          type: 'text',
          content: `<p>This is where data actually lives. The storage layer is organized as a set of <strong>partitions</strong>. Each partition is a group of 3-5 nodes, and every partition runs the <strong>Raft consensus protocol</strong> independently.</p>
<p>Each partition is responsible for a subset of the table's shards. A shard is a range of rows, typically a few hundred gigabytes. Think of it like this:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Table</strong> = the entire dataset (e.g., all trips)',
            '<strong>Shard</strong> = a slice of the table\'s rows (e.g., trips with IDs 1-10000)',
            '<strong>Partition</strong> = a group of replicated nodes that stores one or more shards'
          ]
        },
        {
          type: 'heading',
          text: 'The Control Plane (The Brain)'
        },
        {
          type: 'text',
          content: `<p>The control plane is responsible for the operational health of the cluster. It handles:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Shard assignment</strong> — deciding which partition owns which shards',
            '<strong>Failure detection</strong> — monitoring node health and triggering failovers',
            '<strong>Rebalancing</strong> — moving shards between partitions to balance load or handle growth',
            '<strong>Capacity planning</strong> — adding new partitions when existing ones are near capacity'
          ]
        },
        {
          type: 'callout',
          variant: 'info',
          title: '📐 Architecture Pattern: Separation of Concerns',
          text: 'The three-layer design is a classic distributed systems pattern. By separating routing (stateless query layer) from storage (stateful partition layer) from management (control plane), each layer can be independently scaled, upgraded, and debugged.'
        }
      ]
    },

    // ============ CHAPTER 4: Table & Key Design ============
    {
      id: 'ch4',
      number: 4,
      title: 'Tables, Keys & Sharding',
      subtitle: 'How Docstore structures data and distributes it across the cluster.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Docstore tables look familiar — rows, columns, and values — just like a relational database. But underneath, the key design is what enables horizontal scalability. Understanding <strong>primary keys</strong> vs. <strong>partition keys</strong> is essential.</p>`
        },
        {
          type: 'heading',
          text: 'Table Structure'
        },
        {
          type: 'text',
          content: `<p>Every table in Docstore has:</p>`
        },
        {
          type: 'list',
          items: [
            'A <strong>primary key</strong> — one or more columns that uniquely identify a row',
            '<strong>Regular columns</strong> — the data fields (strings, integers, UDTs, etc.)',
            'An optional <strong>partition key</strong> — determines which shard stores the row',
            'Rows stored in <strong>sorted order</strong> by primary key (enables range scans)'
          ]
        },
        {
          type: 'text',
          content: `<p>The primary key serves two purposes: <strong>uniqueness</strong> (no two rows can have the same primary key) and <strong>ordering</strong> (rows are physically sorted by primary key, enabling efficient range queries).</p>
<p>Internally, primary key columns are stored as a <strong>byte array</strong> using <em>order-preserving encoding</em>. This means the sort order of the encoded bytes matches the logical sort order of the values — enabling fast binary search and range scans at the storage level.</p>`
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Order-Preserving Encoding',
          text: 'This is a subtle but important detail. If you naively convert integers to bytes, "9" would sort after "10" lexicographically. Order-preserving encoding ensures that encode(A) < encode(B) if and only if A < B. This lets the storage engine use raw byte comparison for sorting — much faster than deserializing and comparing values.'
        },
        {
          type: 'heading',
          text: 'Primary Key vs. Partition Key'
        },
        {
          type: 'text',
          content: `<p>This is the most important concept for application developers using Docstore:</p>
<p><strong>Primary Key:</strong> Uniquely identifies a row. Can be a single column or composite (multiple columns). Example: <code>(city_id, trip_id)</code>.</p>
<p><strong>Partition Key:</strong> Determines which shard stores the row. If not explicitly set, the primary key is used. Example: partition by <code>city_id</code> so all trips for a city land on the same shard.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'sharding',
          title: 'How Partition Keys Control Data Locality',
          config: {
            nodes: [
              { id: 'table', label: 'Trips Table', x: 390, y: 30, type: 'rect', color: '#6366f1' },
              { id: 'r1', label: 'SF, trip_001\nSF, trip_002', x: 150, y: 140, type: 'rect', color: '#34d399' },
              { id: 'r2', label: 'NYC, trip_003\nNYC, trip_004', x: 390, y: 140, type: 'rect', color: '#22d3ee' },
              { id: 'r3', label: 'CHI, trip_005\nCHI, trip_006', x: 630, y: 140, type: 'rect', color: '#f59e0b' },
              { id: 'shard1', label: 'Shard A\n(Partition 1)', x: 150, y: 270, type: 'rect', color: '#34d399' },
              { id: 'shard2', label: 'Shard B\n(Partition 2)', x: 390, y: 270, type: 'rect', color: '#22d3ee' },
              { id: 'shard3', label: 'Shard C\n(Partition 3)', x: 630, y: 270, type: 'rect', color: '#f59e0b' },
            ],
            edges: [
              { from: 'table', to: 'r1', label: '' },
              { from: 'table', to: 'r2', label: '' },
              { from: 'table', to: 'r3', label: '' },
              { from: 'r1', to: 'shard1', label: 'city_id = SF' },
              { from: 'r2', to: 'shard2', label: 'city_id = NYC' },
              { from: 'r3', to: 'shard3', label: 'city_id = CHI' },
            ],
            steps: [
              { highlight: ['table'], edgeHighlight: [], text: 'A Trips table with primary key (city_id, trip_id). The partition key is set to city_id — meaning all trips for the same city will be stored together on the same shard.' },
              { highlight: ['table', 'r1', 'r2', 'r3'], edgeHighlight: [0, 1, 2], text: 'Rows are grouped by partition key (city_id). SF trips go together, NYC trips go together, Chicago trips go together. Within each group, rows are sorted by the rest of the primary key (trip_id).' },
              { highlight: ['r1', 'shard1', 'r2', 'shard2', 'r3', 'shard3'], edgeHighlight: [3, 4, 5], text: 'Each group maps to a shard, and each shard is assigned to a partition. This ensures that "get all trips for SF" only hits one shard — no scatter-gather across the cluster.' },
              { highlight: ['shard1'], edgeHighlight: [], text: 'Key insight: The choice of partition key controls data locality. Choosing city_id means city-level queries are fast (single shard). But user-level queries (get all trips for user_123) would need to scan ALL shards.' },
            ]
          }
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '⚠️ Choosing the Wrong Partition Key',
          text: 'If you partition by a column with low cardinality (e.g., status = active/inactive), you get "hot shards" — one shard handling 90% of traffic. If you partition by a column with too-high cardinality (e.g., UUID), every query becomes a cross-shard scatter. The art is choosing a key that balances even distribution with useful data locality.'
        },
        {
          type: 'heading',
          text: 'Materialized Views'
        },
        {
          type: 'text',
          content: `<p>But what if you need to query the same data by <em>different</em> keys? For example, a Trips table partitioned by <code>city_id</code> is great for city-level queries but terrible for user-level queries like "show me all trips by user_123."</p>
<p>This is where <strong>materialized views</strong> come in. A materialized view is a copy of the table partitioned differently — by a different set of columns.</p>`
        },
        {
          type: 'list',
          items: [
            'Main table partitioned by <code>city_id</code> → fast city queries',
            'Materialized view partitioned by <code>user_id</code> → fast user queries',
            'Docstore automatically keeps the view in sync with the main table',
            'The application queries whichever view matches its access pattern'
          ]
        },
        {
          type: 'callout',
          variant: 'info',
          title: '📐 Trade-off: Space vs. Speed',
          text: 'Materialized views trade storage space for query speed. You\'re storing the data twice (or more), but each copy is optimized for a different query pattern. At Uber\'s scale, storage is cheap but latency is expensive — so this trade-off makes sense.'
        }
      ]
    },

    // ============ CHAPTER 5: Replication & Raft ============
    {
      id: 'ch5',
      number: 5,
      title: 'Replication: Raft Consensus in Docstore',
      subtitle: 'How every write is replicated across nodes to guarantee consistency and survive failures.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Docstore eliminates the fundamental limitation of Schemaless (no transactions) and Cassandra (eventual consistency) by using the <strong>Raft consensus protocol</strong> for replication. Every partition is a replicated state machine.</p>`
        },
        {
          type: 'heading',
          text: 'What Is a Replicated State Machine?'
        },
        {
          type: 'text',
          content: `<p>A replicated state machine is a group of nodes that maintain identical copies of the same data. They do this by agreeing on an ordered sequence of operations (the <strong>replicated log</strong>). Each node applies the same operations in the same order, so they all end up in the same state.</p>
<p>In Docstore, each partition is its own replicated state machine with:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>1 Leader</strong> — handles all writes and coordinates replication',
            '<strong>2-4 Followers</strong> — receive replicated writes from the leader',
            '<strong>3-5 total nodes</strong> — each deployed in a different availability zone for fault isolation'
          ]
        },
        {
          type: 'diagram',
          diagramType: 'raft-replication',
          title: 'Raft Consensus in a Docstore Partition',
          config: {
            nodes: [
              { id: 'client', label: 'Query\nEngine', x: 80, y: 180, type: 'circle', color: '#6366f1' },
              { id: 'leader', label: 'Leader\n(Node 1)', x: 310, y: 180, type: 'rect', color: '#6366f1' },
              { id: 'f1', label: 'Follower\n(Node 2)', x: 560, y: 60, type: 'rect', color: '#34d399' },
              { id: 'f2', label: 'Follower\n(Node 3)', x: 560, y: 180, type: 'rect', color: '#34d399' },
              { id: 'f3', label: 'Follower\n(Node 4)', x: 560, y: 300, type: 'rect', color: '#34d399' },
              { id: 'zone1', label: 'Zone A', x: 310, y: 340, type: 'rect', color: '#374151' },
              { id: 'zone2', label: 'Zone B', x: 460, y: 340, type: 'rect', color: '#374151' },
              { id: 'zone3', label: 'Zone C', x: 610, y: 340, type: 'rect', color: '#374151' },
            ],
            edges: [
              { from: 'client', to: 'leader', label: 'Write' },
              { from: 'leader', to: 'f1', label: 'Replicate' },
              { from: 'leader', to: 'f2', label: 'Replicate' },
              { from: 'leader', to: 'f3', label: 'Replicate' },
            ],
            steps: [
              { highlight: ['client', 'leader'], edgeHighlight: [0], text: 'Step 1: The query engine sends a write request to the partition\'s leader. Only the leader accepts writes — followers reject write requests and redirect to the leader.' },
              { highlight: ['leader', 'f1', 'f2', 'f3'], edgeHighlight: [1, 2, 3], text: 'Step 2: The leader appends the write to its local log, then sends it to all followers in parallel. Each follower appends it to their own log and acknowledges.' },
              { highlight: ['leader', 'f1', 'f2'], edgeHighlight: [1, 2], text: 'Step 3: Once a MAJORITY (leader + at least half the followers) have acknowledged, the write is "committed." Here, 3 out of 4 nodes = majority. Node 4 can be slow or down — doesn\'t matter.' },
              { highlight: ['leader', 'client'], edgeHighlight: [0], text: 'Step 4: The leader applies the committed write to its state machine (MySQL) and responds to the query engine with success. The write is now durable and consistent.' },
              { highlight: ['f3', 'zone3'], edgeHighlight: [3], text: 'Even if Node 4 is temporarily down, it will catch up later by replaying missed log entries from the leader. The key guarantee: a committed write is NEVER lost as long as a majority of nodes survive.' },
            ]
          }
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Why Raft over Paxos?',
          text: 'Uber chose Raft specifically because it\'s designed for understandability. The original Paxos algorithm is notoriously difficult to implement correctly. Raft provides equivalent guarantees but with a clearer separation of leader election, log replication, and safety — making it easier to implement, test, and debug in production.'
        },
        {
          type: 'heading',
          text: 'Failure Handling'
        },
        {
          type: 'text',
          content: `<p>Each of the 3-5 nodes in a partition is deployed to an <strong>independent availability zone</strong>. This means a single zone failure (power outage, network issue) only takes out one node. The partition continues to operate with the remaining nodes.</p>
<p>What happens during different failure scenarios:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>One follower dies</strong> — no impact. Leader continues with remaining majority.',
            '<strong>Leader dies</strong> — followers detect the failure (via heartbeat timeout), hold an election, and a new leader is elected within seconds. Writes stall briefly during election.',
            '<strong>A zone goes down</strong> — at most one node per partition is affected. Majority survives.',
            '<strong>Two nodes die</strong> (in a 5-node partition) — still have 3 nodes = majority. System continues.',
            '<strong>Majority dies</strong> — partition becomes unavailable (CP trade-off). No stale reads, no split-brain.'
          ]
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '⚠️ CP System: Consistency over Availability',
          text: 'Docstore is a CP system (in CAP theorem terms). If a partition loses its majority, it becomes unavailable rather than serving potentially stale data. This is the opposite of Dynamo (AP) or Cassandra (AP). For Uber\'s use cases — trip records, payments, rider state — correctness matters more than availability.'
        }
      ]
    },

    // ============ CHAPTER 6: Transactions ============
    {
      id: 'ch6',
      number: 6,
      title: 'Transactions: ACID at Scale',
      subtitle: 'How Docstore uses MySQL under the hood to guarantee ACID semantics across a distributed cluster.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>One of Docstore's most powerful features is its transaction support. Unlike Schemaless (no transactions) or Cassandra (lightweight transactions only), Docstore provides <strong>full ACID transactions</strong> on a partition level. And the secret weapon is hiding in plain sight: <strong>MySQL</strong>.</p>`
        },
        {
          type: 'heading',
          text: 'MySQL as the Storage Engine'
        },
        {
          type: 'text',
          content: `<p>Each node in a Docstore partition runs <strong>MySQL/InnoDB</strong> as its local storage engine. This is a brilliant pragmatic choice:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Battle-tested ACID</strong> — MySQL\'s InnoDB engine has 20+ years of production hardening. Row-level locking, MVCC, crash recovery — all proven.',
            '<strong>Efficient storage</strong> — InnoDB\'s B+ tree indexes and buffer pool are highly optimized for both reads and writes.',
            '<strong>Concurrency control for free</strong> — MySQL handles row-level locking, deadlock detection, and isolation levels.',
            '<strong>Ecosystem</strong> — decades of operational tooling, monitoring, and expertise.'
          ]
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Build on Giants',
          text: 'Rather than building a custom storage engine (enormous effort), Uber reused MySQL for what it\'s great at — single-node ACID transactions. They added Raft on top to turn single-node guarantees into distributed guarantees. This "layered reuse" approach saved years of development time.'
        },
        {
          type: 'heading',
          text: 'How a Transaction Works'
        },
        {
          type: 'text',
          content: `<p>The unit of replication in Docstore is a <strong>MySQL transaction</strong>. Here's the lifecycle:</p>`
        },
        {
          type: 'diagram',
          diagramType: 'transaction-flow',
          title: 'Docstore Transaction Lifecycle',
          config: {
            nodes: [
              { id: 'app', label: 'Application', x: 100, y: 40, type: 'circle', color: '#6366f1' },
              { id: 'qe', label: 'Query\nEngine', x: 100, y: 150, type: 'rect', color: '#22d3ee' },
              { id: 'leader', label: 'Leader\n(MySQL)', x: 390, y: 150, type: 'rect', color: '#6366f1' },
              { id: 'raft', label: 'Raft\nLog', x: 390, y: 270, type: 'rect', color: '#f59e0b' },
              { id: 'f1', label: 'Follower 1\n(MySQL)', x: 600, y: 100, type: 'rect', color: '#34d399' },
              { id: 'f2', label: 'Follower 2\n(MySQL)', x: 600, y: 220, type: 'rect', color: '#34d399' },
            ],
            edges: [
              { from: 'app', to: 'qe', label: 'BEGIN TX' },
              { from: 'qe', to: 'leader', label: 'Operations' },
              { from: 'leader', to: 'raft', label: 'Log TX' },
              { from: 'raft', to: 'f1', label: 'Replicate' },
              { from: 'raft', to: 'f2', label: 'Replicate' },
              { from: 'leader', to: 'qe', label: 'COMMIT OK' },
            ],
            steps: [
              { highlight: ['app', 'qe'], edgeHighlight: [0], text: 'Step 1 — BEGIN: The application starts a transaction. All subsequent operations (INSERT, UPDATE, DELETE) are part of this transaction.' },
              { highlight: ['qe', 'leader'], edgeHighlight: [1], text: 'Step 2 — EXECUTE: Operations are sent to the partition\'s leader, which executes them within a MySQL transaction. MySQL acquires row-level locks as needed for concurrency control.' },
              { highlight: ['leader', 'raft'], edgeHighlight: [2], text: 'Step 3 — LOG: When the app sends COMMIT, the leader writes the entire MySQL transaction to the Raft log. This is the unit of replication — one Raft log entry = one complete MySQL transaction.' },
              { highlight: ['raft', 'f1', 'f2'], edgeHighlight: [3, 4], text: 'Step 4 — REPLICATE: The Raft log entry is sent to all followers. Each follower replays the MySQL transaction on their local MySQL instance. Majority acknowledgment = committed.' },
              { highlight: ['leader', 'qe', 'app'], edgeHighlight: [5], text: 'Step 5 — RESPOND: Once committed, the leader confirms to the query engine, which responds to the application. The transaction is now durable across multiple nodes and zones.' },
            ]
          }
        },
        {
          type: 'heading',
          text: 'Concurrency Control: How Conflicts Are Handled'
        },
        {
          type: 'text',
          content: `<p>What happens when two transactions try to modify the same rows at the same time? Docstore delegates this entirely to <strong>MySQL's row-level locking</strong>.</p>`
        },
        {
          type: 'diagram',
          diagramType: 'interleaved-tx',
          title: 'Interleaved Transactions — Concurrency Control',
          config: {
            nodes: [
              { id: 'tx1', label: 'Transaction A', x: 170, y: 40, type: 'rect', color: '#6366f1' },
              { id: 'tx2', label: 'Transaction B', x: 610, y: 40, type: 'rect', color: '#f59e0b' },
              { id: 'ins1', label: 'A: INSERT\nrow_1', x: 170, y: 140, type: 'rect', color: '#6366f1' },
              { id: 'ins2', label: 'B: INSERT\nrow_1', x: 610, y: 140, type: 'rect', color: '#f59e0b' },
              { id: 'lock', label: 'MySQL\nRow Lock', x: 390, y: 220, type: 'rect', color: '#f87171' },
              { id: 'commit1', label: 'A: COMMIT\n✓ Success', x: 170, y: 310, type: 'rect', color: '#34d399' },
              { id: 'retry', label: 'B: BLOCKED\nthen retries', x: 610, y: 310, type: 'rect', color: '#f87171' },
            ],
            edges: [
              { from: 'tx1', to: 'ins1', label: '' },
              { from: 'tx2', to: 'ins2', label: '' },
              { from: 'ins1', to: 'lock', label: 'Acquires lock' },
              { from: 'ins2', to: 'lock', label: 'Waits for lock' },
              { from: 'lock', to: 'commit1', label: '' },
              { from: 'lock', to: 'retry', label: '' },
            ],
            steps: [
              { highlight: ['tx1', 'tx2', 'ins1', 'ins2'], edgeHighlight: [0, 1], text: 'Two transactions (A and B) both try to INSERT a row with the same primary key (row_1) at roughly the same time.' },
              { highlight: ['ins1', 'lock'], edgeHighlight: [2], text: 'Transaction A arrives first and acquires a MySQL row lock on row_1. The INSERT succeeds and A holds the lock.' },
              { highlight: ['ins2', 'lock'], edgeHighlight: [3], text: 'Transaction B tries to INSERT the same row_1. MySQL detects the conflict — B is BLOCKED and waits for A\'s lock to be released.' },
              { highlight: ['lock', 'commit1', 'retry'], edgeHighlight: [4, 5], text: 'A commits successfully, releasing the lock. B is now unblocked — but gets a duplicate key error. The application can handle this by retrying with different logic. Concurrent writes to the same row are always serialized.' },
            ]
          }
        },
        {
          type: 'callout',
          variant: 'info',
          title: '📐 MySQL\'s Locking = Docstore\'s Concurrency Control',
          text: 'By the time the Raft commit flow starts, MySQL has already resolved all locking. This is key — Docstore doesn\'t need its own conflict resolution logic. MySQL provides serializable isolation within a node, and Raft ensures all nodes see the same serial order. Combined, you get distributed serializability.'
        },
        {
          type: 'heading',
          text: 'ACID Guarantees Explained'
        },
        {
          type: 'list',
          items: [
            '<strong>Atomicity</strong> — the MySQL transaction is all-or-nothing. If any operation fails, the entire transaction is rolled back.',
            '<strong>Consistency</strong> — schema-on-write enforcement + unique constraints + foreign keys ensure data is always valid.',
            '<strong>Isolation</strong> — MySQL\'s row-level locking serializes concurrent writes to the same rows.',
            '<strong>Durability</strong> — the Raft log is replicated to a majority of nodes across zones. Even if nodes crash, committed data survives.'
          ]
        }
      ]
    },

    // ============ CHAPTER 7: Consistency Model & Conclusion ============
    {
      id: 'ch7',
      number: 7,
      title: 'Strict Serializability & What It All Means',
      subtitle: 'Understanding Docstore\'s consistency guarantees and why they matter for real applications.',
      duration: '5 min',
      blocks: [
        {
          type: 'text',
          content: `<p>Docstore provides <strong>strict serializability</strong> on a partition level. This sounds academic, but it has a very practical meaning: <em>you can pretend that all transactions on a partition happen one at a time, in order</em>.</p>`
        },
        {
          type: 'heading',
          text: 'What Is Strict Serializability?'
        },
        {
          type: 'text',
          content: `<p>Let's break it down into two parts:</p>
<p><strong>Serializability:</strong> The result of concurrent transactions is the same as if they had executed one at a time, in <em>some</em> serial order. This prevents all concurrency anomalies — dirty reads, phantom reads, write skew.</p>
<p><strong>Strict (or "Linearizable"):</strong> That serial order must respect real-time ordering. If transaction A commits before transaction B starts, then A must appear before B in the serial order. No time-travel.</p>
<p>Combined: <strong>strict serializability = serializability + real-time ordering</strong>. This is the strongest possible consistency guarantee a database can provide.</p>`
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 Why Developers Love This',
          text: 'With strict serializability, you can reason about your code as if the database is single-threaded. No need to worry about race conditions, stale reads, or eventual consistency windows. "I wrote X, then I read X, so I get X" — always. This dramatically simplifies application development.'
        },
        {
          type: 'heading',
          text: 'The Read-After-Write Guarantee'
        },
        {
          type: 'text',
          content: `<p>The most important practical consequence: <strong>if a write to a key is successfully committed, all subsequent reads of that key return the written value</strong> (or a later value, if another write happens after).</p>
<p>This sounds obvious, but many databases can't guarantee it:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Cassandra (eventual consistency)</strong> — read after write might return OLD value if you hit a different replica',
            '<strong>DynamoDB (default)</strong> — eventually consistent reads may lag behind writes',
            '<strong>Docstore</strong> — reads always return the latest committed value. Period.'
          ]
        },
        {
          type: 'heading',
          text: 'CAP Theorem: Docstore\'s Choice'
        },
        {
          type: 'diagram',
          diagramType: 'cap-theorem',
          title: 'CAP Theorem — Where Docstore Sits',
          config: {
            nodes: [
              { id: 'c', label: 'Consistency', x: 390, y: 40, type: 'circle', color: '#6366f1' },
              { id: 'a', label: 'Availability', x: 170, y: 300, type: 'circle', color: '#34d399' },
              { id: 'p', label: 'Partition\nTolerance', x: 610, y: 300, type: 'circle', color: '#f59e0b' },
              { id: 'cp', label: 'CP: Docstore\nSpanner, HBase', x: 540, y: 140, type: 'rect', color: '#6366f1' },
              { id: 'ap', label: 'AP: Dynamo\nCassandra', x: 390, y: 320, type: 'rect', color: '#34d399' },
              { id: 'ca', label: 'CA: Traditional\nRDBMS', x: 220, y: 140, type: 'rect', color: '#64748b' },
            ],
            edges: [
              { from: 'c', to: 'a', label: '' },
              { from: 'a', to: 'p', label: '' },
              { from: 'p', to: 'c', label: '' },
            ],
            steps: [
              { highlight: ['c', 'a', 'p'], edgeHighlight: [0, 1, 2], text: 'The CAP theorem states: in a distributed system, during a network partition, you can have either Consistency or Availability, but not both. Every distributed database must choose.' },
              { highlight: ['ap'], edgeHighlight: [], text: 'AP systems (Dynamo, Cassandra): During partitions, they remain available but may serve stale reads. Writes on different sides of the partition may conflict and need resolution later.' },
              { highlight: ['cp'], edgeHighlight: [], text: 'CP systems (Docstore, Spanner, HBase): During partitions, they reject requests (become unavailable) rather than risk serving inconsistent data. Reads are always correct.' },
              { highlight: ['cp', 'c', 'p'], edgeHighlight: [2], text: 'Docstore chose CP because for Uber\'s core use cases — trips, payments, rider state — a wrong answer is worse than a slow answer. It\'s better to retry a failed request than to process a payment twice.' },
            ]
          }
        },
        {
          type: 'heading',
          text: 'The Complete Picture'
        },
        {
          type: 'text',
          content: `<p>Let's zoom out and see how all the pieces fit together:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Flexible Document Model</strong> — schema-on-write with evolution, nested types, and sparse columns. Best of relational + document worlds.',
            '<strong>Layered Architecture</strong> — stateless query engines + stateful partitions + control plane. Each layer scales independently.',
            '<strong>Raft Consensus</strong> — every partition is a replicated state machine. One leader, multiple followers, majority-based commits.',
            '<strong>MySQL underneath</strong> — battle-tested ACID transactions, row-level locking, proven storage engine.',
            '<strong>Strict Serializability</strong> — MySQL provides local ACID, Raft provides distributed consensus. Combined = distributed ACID.',
            '<strong>CP trade-off</strong> — consistency over availability. Correct data, always.'
          ]
        },
        {
          type: 'callout',
          variant: 'insight',
          title: '💡 The Big Lesson',
          text: 'Docstore shows that you don\'t have to choose between NoSQL flexibility and SQL consistency. By layering proven technologies (MySQL + Raft) and adding a smart schema model, Uber built a database that gives developers the simplicity of a document store with the guarantees of a transactional database. It\'s pragmatic engineering at its best.'
        },
        {
          type: 'heading',
          text: 'What\'s Next'
        },
        {
          type: 'text',
          content: `<p>Docstore is in production at Uber, serving business-critical workloads. The Uber team has outlined future posts covering:</p>`
        },
        {
          type: 'list',
          items: [
            '<strong>Part 2: Data Modeling</strong> — how to choose between hierarchical and relational models in Docstore',
            '<strong>Part 3: Materialized Views</strong> — the MV refresh framework and automatic query routing to the optimal view',
            'Deeper dives into the <strong>Change Data Capture</strong> pipeline and how downstream services consume Docstore events'
          ]
        },
        {
          type: 'callout',
          variant: 'info',
          title: '🎓 Key Takeaways from This Paper',
          text: '1) Immutability simplifies systems but limits flexibility. 2) Eventual consistency is a hidden tax on developer productivity. 3) Schema-on-write catches bugs at the source. 4) Layer proven technologies — MySQL for local ACID, Raft for distributed consensus. 5) CP over AP when correctness matters more than availability.'
        }
      ]
    }
  ]
);
