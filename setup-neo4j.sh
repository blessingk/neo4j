#!/bin/bash

echo "🔧 Setting up Neo4j constraints..."

# Neo4j connection details
NEO4J_URI="http://localhost:7474"
USERNAME="neo4j"
PASSWORD="localpassword"

# Function to run Cypher query
run_cypher() {
    local query="$1"
    echo "Running: $query"
    
    curl -s -X POST "$NEO4J_URI/db/neo4j/tx/commit" \
        -H "Content-Type: application/json" \
        -H "Authorization: Basic $(echo -n "$USERNAME:$PASSWORD" | base64)" \
        -d "{
            \"statements\": [
                {
                    \"statement\": \"$query\",
                    \"parameters\": {}
                }
            ]
        }" | jq -r '.results[0].data[0].row[0] // "Success"'
}

# Create constraints
echo "Creating constraints..."

run_cypher "CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (c:Customer) REQUIRE c.id IS UNIQUE"
run_cypher "CREATE CONSTRAINT brand_id IF NOT EXISTS FOR (b:Brand) REQUIRE b.id IS UNIQUE"
run_cypher "CREATE CONSTRAINT identity_unique IF NOT EXISTS FOR (i:Identity) REQUIRE (i.provider, i.externalId) IS UNIQUE"
run_cypher "CREATE CONSTRAINT session_unique IF NOT EXISTS FOR (s:Session) REQUIRE (s.provider, s.externalId) IS UNIQUE"

echo "✅ Neo4j constraints setup complete!"
echo ""
echo "You can now test the API endpoints:"
echo "  curl -X POST http://localhost:3000/identity/identify \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"provider\": \"amplitude\", \"externalSessionId\": \"amp_sess_123\", \"brandId\": \"brand-za\"}'"
