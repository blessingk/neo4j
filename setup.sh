
#!/bin/bash

echo "🚀 Setting up Customer Identity Service..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start Neo4j
echo "📊 Starting Neo4j..."
docker-compose up -d

# Wait for Neo4j to be ready
echo "⏳ Waiting for Neo4j to be ready..."
sleep 10

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ Created .env file. Please review and update if needed."
else
    echo "✅ .env file already exists."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Neo4j Browser at http://localhost:7474"
echo "2. Run the constraints from neo4j-bootstrap.cypher"
echo "3. Start the service: npm run start:dev"
echo ""
echo "Default Neo4j credentials:"
echo "  Username: neo4j"
echo "  Password: localpassword"
