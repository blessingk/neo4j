// Simplified queries for one long-lived session per customer using internal session ID
export const UPSERT_BRAND = `
MERGE (b:Brand {id: $brandId})
SET b.name = $name, b.slug = $slug
RETURN b
`;

// Create or update customer's single long-lived session using internal session ID
export const UPSERT_CUSTOMER_SESSION = `
MERGE (c:Customer {internalSessionId: $internalSessionId})
ON CREATE SET c.id = randomUUID(), c.createdAt = datetime()
ON MATCH SET c.email = $email
WITH c
FOREACH (email IN CASE WHEN $email IS NOT NULL THEN [$email] ELSE [] END |
  SET c.email = email
)
WITH c
MERGE (s:Session {internalSessionId: $internalSessionId})
ON CREATE SET s.id = randomUUID(), s.createdAt = datetime()
SET s.lastSeenAt = datetime(),
    s.brandId = $brandId
WITH c, s
FOREACH (email IN CASE WHEN $email IS NOT NULL THEN [$email] ELSE [] END |
  SET s.email = email
)
WITH c, s
FOREACH (brazeSession IN CASE WHEN $brazeSession IS NOT NULL THEN [$brazeSession] ELSE [] END |
  SET s.brazeSession = brazeSession
)
WITH c, s
FOREACH (amplitudeSession IN CASE WHEN $amplitudeSession IS NOT NULL THEN [$amplitudeSession] ELSE [] END |
  SET s.amplitudeSession = amplitudeSession
)
WITH c, s
MERGE (s)-[:BELONGS_TO]->(c)
WITH c, s
OPTIONAL MATCH (b:Brand {id: $brandId})
FOREACH (brand IN CASE WHEN b IS NOT NULL THEN [b] ELSE [] END |
  MERGE (s)-[:FOR_BRAND]->(brand)
)
RETURN c, s
`;

// Quick identification by internal session ID
export const QUICK_IDENTIFY_CUSTOMER = `
MATCH (s:Session {internalSessionId: $internalSessionId})
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Customer)
OPTIONAL MATCH (s)-[:FOR_BRAND]->(b:Brand)
RETURN s, c, b
`;

// Find customer by any session identifier
export const FIND_CUSTOMER_BY_SESSION = `
MATCH (s:Session)
WHERE (s.brazeSession = $brazeSession)
   OR (s.amplitudeSession = $amplitudeSession)
   OR (s.internalSessionId = $internalSessionId)
   OR (s.email = $email)
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Customer)
OPTIONAL MATCH (s)-[:FOR_BRAND]->(b:Brand)
RETURN s, c, b
LIMIT 1
`;

// Update customer's session (when they visit again)
export const UPDATE_CUSTOMER_SESSION = `
MATCH (s:Session {internalSessionId: $internalSessionId})
SET s.lastSeenAt = datetime(),
    s.brandId = $brandId
WITH s
FOREACH (email IN CASE WHEN $email IS NOT NULL THEN [$email] ELSE [] END |
  SET s.email = email
)
WITH s
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Customer)
FOREACH (email IN CASE WHEN $email IS NOT NULL THEN [$email] ELSE [] END |
  SET c.email = email
)
WITH s
FOREACH (brazeSession IN CASE WHEN $brazeSession IS NOT NULL THEN [$brazeSession] ELSE [] END |
  SET s.brazeSession = brazeSession
)
WITH s
FOREACH (amplitudeSession IN CASE WHEN $amplitudeSession IS NOT NULL THEN [$amplitudeSession] ELSE [] END |
  SET s.amplitudeSession = amplitudeSession
)
WITH s
OPTIONAL MATCH (b:Brand {id: $brandId})
FOREACH (brand IN CASE WHEN b IS NOT NULL THEN [b] ELSE [] END |
  MERGE (s)-[:FOR_BRAND]->(brand)
)
RETURN s
`;

// Get customer's single session with all details
export const GET_CUSTOMER_SESSION = `
MATCH (c:Customer {internalSessionId: $internalSessionId})
OPTIONAL MATCH (s:Session {internalSessionId: $internalSessionId})
OPTIONAL MATCH (s)-[:FOR_BRAND]->(b:Brand)
RETURN c, s, b
`;

// Get all customers with their sessions
export const GET_ALL_CUSTOMERS_WITH_SESSIONS = `
MATCH (c:Customer)
OPTIONAL MATCH (s:Session {internalSessionId: c.internalSessionId})
OPTIONAL MATCH (s)-[:FOR_BRAND]->(b:Brand)
RETURN c, s, b
ORDER BY s.lastSeenAt DESC
`;

// Get customer loyalty profile (simplified)
export const GET_CUSTOMER_LOYALTY_PROFILE = `
MATCH (c:Customer {internalSessionId: $internalSessionId})
OPTIONAL MATCH (s:Session {internalSessionId: $internalSessionId})
OPTIONAL MATCH (s)-[:FOR_BRAND]->(b:Brand)
RETURN c, s, b
`;

// Find customer by email (for email changes)
export const FIND_CUSTOMER_BY_EMAIL = `
MATCH (s:Session {email: $email})
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Customer)
OPTIONAL MATCH (s)-[:FOR_BRAND]->(b:Brand)
RETURN s, c, b
LIMIT 1
`;
