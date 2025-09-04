
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

# Set up Neo4j constraints
echo "🔧 Setting up Neo4j constraints..."
if [ -f ./setup-neo4j.sh ]; then
    chmod +x ./setup-neo4j.sh
    ./setup-neo4j.sh
else
    echo "⚠️  setup-neo4j.sh not found. Please run it manually after setup."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the service: npm run start:dev"
echo "2. Test the API endpoints (see examples below)"
echo ""
echo "Default Neo4j credentials:"
echo "  Username: neo4j"
echo "  Password: localpassword"
echo ""
echo "Neo4j Browser: http://localhost:7474"
