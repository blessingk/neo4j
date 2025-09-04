# Neo4j Bootstrap Scripts

## Run these constraints in Neo4j Browser (http://localhost:7474)

```cypher
-- Customer uniqueness constraint
CREATE CONSTRAINT customer_id IF NOT EXISTS
FOR (c:Customer) REQUIRE c.id IS UNIQUE;

-- Brand uniqueness constraint  
CREATE CONSTRAINT brand_id IF NOT EXISTS
FOR (b:Brand) REQUIRE b.id IS UNIQUE;

-- Identity composite uniqueness constraint
CREATE CONSTRAINT identity_unique IF NOT EXISTS
FOR (i:Identity) REQUIRE (i.provider, i.externalId) IS UNIQUE;

-- Session composite uniqueness constraint
CREATE CONSTRAINT session_unique IF NOT EXISTS
FOR (s:Session) REQUIRE (s.provider, s.externalId) IS UNIQUE;
```

## Sample Data Queries

```cypher
-- Create a sample brand
MERGE (b:Brand {id: 'brand-za', name: 'Brand South Africa', slug: 'brand-za'})
RETURN b;

-- Create a sample session
MERGE (s:Session {provider: 'amplitude', externalId: 'amp_sess_123'})
ON CREATE SET s.id = randomUUID(), s.createdAt = datetime()
SET s.lastSeenAt = datetime()
WITH s
MATCH (b:Brand {id: 'brand-za'})
MERGE (s)-[:FOR_BRAND]->(b)
RETURN s;

-- Link session to customer
MERGE (c:Customer {email: 'alice@example.com'})
ON CREATE SET c.id = randomUUID(), c.createdAt = datetime()
WITH c
MATCH (s:Session {provider: 'amplitude', externalId: 'amp_sess_123'})
MERGE (s)-[:BELONGS_TO]->(c)
MERGE (c)-[:LATEST_SESSION]->(s)
RETURN c;
```

## Useful Queries

```cypher
-- Find all sessions for a customer
MATCH (c:Customer {email: 'alice@example.com'})<-[:BELONGS_TO]-(s:Session)
RETURN s;

-- Find customer by session
MATCH (s:Session {provider: 'amplitude', externalId: 'amp_sess_123'})-[:BELONGS_TO]->(c:Customer)
RETURN c;

-- Find all brands a customer has sessions for
MATCH (c:Customer {email: 'alice@example.com'})<-[:BELONGS_TO]-(s:Session)-[:FOR_BRAND]->(b:Brand)
RETURN DISTINCT b;
```
