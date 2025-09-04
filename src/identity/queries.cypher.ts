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

export const LOOKUP_SESSION_CUSTOMER = `
OPTIONAL MATCH (s:Session {provider: $provider, externalId: $externalSessionId})
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Customer)
RETURN CASE 
  WHEN s IS NULL OR c IS NULL THEN null 
  ELSE c 
END as c
`;

export const LINK_SESSION_TO_CUSTOMER_BY_EMAIL = `
MERGE (c:Customer {email: $email})
ON CREATE SET c.id = randomUUID(), c.createdAt = datetime()
WITH c
MATCH (s:Session {provider: $provider, externalId: $externalSessionId})
MERGE (s)-[:BELONGS_TO]->(c)
MERGE (c)-[:LATEST_SESSION]->(s)
RETURN c
`;

export const LINK_SESSION_TO_CUSTOMER_BY_IDENTITY = `
MERGE (i:Identity {provider: $identityProvider, externalId: $identityExternalId})
WITH i
MERGE (c:Customer)-[:HAS_IDENTITY]->(i)
ON CREATE SET c.id = randomUUID(), c.createdAt = datetime()
WITH c
MATCH (s:Session {provider: $provider, externalId: $externalSessionId})
MERGE (s)-[:BELONGS_TO]->(c)
MERGE (c)-[:LATEST_SESSION]->(s)
RETURN c
`;
