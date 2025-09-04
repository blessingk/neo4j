# Customer Identity Service

A Nest.js service that stitches anonymous analytics sessions (Braze/Amplitude) to unified customers across brands using Neo4j.

## Quick Start

1. **Run the setup script:**
```bash
./setup.sh
```

This will:
- Start Neo4j with Docker
- Install dependencies
- Create `.env` file from template

2. **Set up Neo4j constraints:**
```bash
./setup-neo4j.sh
```

This will automatically create all required database constraints.

3. **Start the service:**
```bash
npm run start:dev
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Brand Management
- `POST /identity/brand` - Create or update a brand

### Session Identification
- `POST /identity/identify` - Track anonymous session
- `POST /identity/link-login` - Link session to customer on login
- `GET /identity/customer-for-session` - Resolve customer for session

## Usage Examples

### Anonymous Page View
```bash
curl -X POST http://localhost:3000/identity/identify \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "amplitude",
    "externalSessionId": "amp_sess_123",
    "brandId": "brand-za"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3000/identity/link-login \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "amplitude",
    "externalSessionId": "amp_sess_123",
    "brandId": "brand-za",
    "email": "alice@example.com"
  }'
```

### Resolve Customer
```bash
curl "http://localhost:3000/identity/customer-for-session?provider=amplitude&externalSessionId=amp_sess_123"
```

## Graph Model

**Nodes:**
- `(:Customer {id, email?, phone?, ...})`
- `(:Brand {id, name, slug})`
- `(:Session {id, provider, externalId, createdAt})`
- `(:Identity {provider, externalId})`
- `(:Device {fingerprint?})`

**Relationships:**
- `(:Session)-[:FOR_BRAND]->(:Brand)`
- `(:Session)-[:BELONGS_TO]->(:Customer)`
- `(:Customer)-[:HAS_IDENTITY]->(:Identity)`
- `(:Customer)-[:LATEST_SESSION]->(:Session)`

## Development

- `npm run start:dev` - Start in development mode
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
