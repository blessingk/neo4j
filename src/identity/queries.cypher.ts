// Enhanced queries for the new workflow
export const UPSERT_BRAND = `
MERGE (b:Brand {id: $brandId})
SET b.name = $name, b.slug = $slug
RETURN b
`;

export const UPSERT_SESSION = `
MERGE (s:Session {provider: $provider, externalId: $externalSessionId})
ON CREATE SET s.id = randomUUID(), s.createdAt = datetime()
SET s.lastSeenAt = datetime()
WITH s
MATCH (b:Brand {id: $brandId})
MERGE (s)-[:FOR_BRAND]->(b)
RETURN s
`;

export const UPSERT_INTERNAL_SESSION = `
MERGE (s:Session {provider: 'internal', externalId: $internalSessionId})
ON CREATE SET s.id = randomUUID(), s.createdAt = datetime()
SET s.lastSeenAt = datetime()
WITH s
MATCH (b:Brand {id: $brandId})
MERGE (s)-[:FOR_BRAND]->(b)
RETURN s
`;

// Quick identification by stable external sessions (Braze/Amplitude)
export const QUICK_IDENTIFY_BY_EXTERNAL_SESSION = `
MATCH (s:Session {provider: $provider, externalId: $externalSessionId})
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Customer)
RETURN s, c
`;

// Quick identification by internal session (after login)
export const QUICK_IDENTIFY_BY_INTERNAL_SESSION = `
MATCH (s:Session {provider: 'internal', externalId: $internalSessionId})
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Customer)
RETURN s, c
`;

// Link external session to customer (when we first identify them)
export const LINK_EXTERNAL_SESSION_TO_CUSTOMER = `
MERGE (c:Customer {email: $email})
ON CREATE SET c.id = randomUUID(), c.createdAt = datetime()
WITH c
MATCH (s:Session {provider: $provider, externalId: $externalSessionId})
MERGE (s)-[:BELONGS_TO]->(c)
RETURN c
`;

// Link internal session to customer (after login)
export const LINK_INTERNAL_SESSION_TO_CUSTOMER = `
MERGE (c:Customer {email: $email})
ON CREATE SET c.id = randomUUID(), c.createdAt = datetime()
WITH c
MATCH (s:Session {provider: 'internal', externalId: $internalSessionId})
MERGE (s)-[:BELONGS_TO]->(c)
MERGE (c)-[:LATEST_SESSION]->(s)
RETURN c
`;

// Link internal session to existing external sessions (stitching)
export const LINK_INTERNAL_TO_EXISTING_SESSIONS = `
MATCH (c:Customer {email: $email})
WITH c
MATCH (s:Session {provider: 'internal', externalId: $internalSessionId})
MERGE (s)-[:BELONGS_TO]->(c)
MERGE (c)-[:LATEST_SESSION]->(s)
WITH c, s
MATCH (existingSession:Session)-[:BELONGS_TO]->(c)
WHERE existingSession.provider IN ['braze', 'amplitude']
MERGE (s)-[:LINKED_TO]->(existingSession)
RETURN c
`;

// Get all sessions for a customer
export const GET_CUSTOMER_WITH_ALL_SESSIONS = `
MATCH (c:Customer {email: $email})
OPTIONAL MATCH (s:Session)-[:BELONGS_TO]->(c)
RETURN c, collect(s) as sessions
`;

// Find customer by any session type
export const FIND_CUSTOMER_BY_ANY_SESSION = `
MATCH (s:Session)
WHERE (s.provider = $provider AND s.externalId = $externalSessionId)
   OR (s.provider = 'internal' AND s.externalId = $internalSessionId)
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Customer)
RETURN c
LIMIT 1
`;

// Get customer's latest session
export const GET_CUSTOMER_LATEST_SESSION = `
MATCH (c:Customer {email: $email})-[:LATEST_SESSION]->(s:Session)
RETURN s
`;
