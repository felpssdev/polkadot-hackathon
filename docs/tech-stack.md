# Technology Stack

Complete list of technologies used in PolkaPay.

## Backend

### Core Framework

**FastAPI 0.104+**
- Modern Python web framework
- Async request handling
- Automatic API documentation
- Type hints validation
- High performance

**Python 3.11+**
- Latest language features
- Improved performance
- Better type hints
- Pattern matching

### Database

**PostgreSQL 15**
- Relational database
- ACID compliance
- JSON support
- Full-text search
- Robust indexing

**SQLAlchemy 2.0+**
- ORM (Object-Relational Mapping)
- Database migrations
- Query builder
- Connection pooling

**Alembic**
- Database migration tool
- Version control for schema
- Automatic migration generation

### Cache & Queue

**Redis 7**
- In-memory data store
- Session management
- Rate limiting
- Caching layer
- Pub/Sub messaging

### Blockchain Integration

**py-substrate-interface 1.7+**
- Python library for Substrate
- Connect to Polkadot nodes
- Submit extrinsics
- Query chain state
- Event monitoring

**Polkadot (Rococo Testnet)**
- Testnet for development
- Smart contract support
- DOT token (test)
- Free faucet available

**ink! 4.3+**
- Smart contract language
- Rust-based
- WebAssembly compilation
- Polkadot native
- Small contract size

### Payment Integration

**PIX API (Mock)**
- Brazilian instant payment
- QR code generation
- Payment verification
- Future: Stark Bank, Mercado Pago

### Authentication

**python-jose**
- JWT token generation
- Token validation
- Cryptographic signing

**passlib**
- Password hashing
- Secure algorithms
- Salt generation

### HTTP Client

**httpx**
- Async HTTP client
- HTTP/2 support
- Connection pooling
- Timeout handling

### Development Tools

**uvicorn**
- ASGI server
- Hot reload
- WebSocket support
- Production ready

**pytest**
- Testing framework
- Fixtures support
- Async testing
- Coverage reports

## Frontend

### Core Framework

**Next.js 15**
- React framework
- App Router
- Server components
- API routes
- Image optimization
- File-based routing

**React 19**
- UI library
- Component-based
- Hooks API
- Server components
- Concurrent features

**TypeScript 5.3+**
- Static typing
- Type inference
- Interface definitions
- Better IDE support

### Styling

**Tailwind CSS 4**
- Utility-first CSS
- JIT compiler
- Custom theme
- Responsive design
- Dark mode support

**8bitcn/ui**
- 8-bit styled components
- Based on shadcn/ui
- Customizable
- Accessible
- TypeScript support

**Press Start 2P**
- Pixel art font
- Google Fonts
- Retro aesthetic

### Blockchain Integration

**@polkadot/extension-dapp 0.46+**
- Wallet connection
- Account management
- Message signing
- Extension detection

**@polkadot/api 10.11+**
- Polkadot API client
- Chain interaction
- Type definitions
- Event subscriptions

**@polkadot/util 12.6+**
- Utility functions
- Address formatting
- Type conversions
- Cryptographic helpers

**@polkadot/util-crypto 12.6+**
- Cryptographic operations
- Key generation
- Signature verification
- Hash functions

### UI Components

**Lucide React**
- Icon library
- Modern icons
- Tree-shakeable
- Customizable

**Radix UI**
- Unstyled components
- Accessible
- Keyboard navigation
- Focus management

### State Management

**React Context API**
- Global state
- Wallet state
- User preferences
- Theme management

### HTTP Client

**Fetch API**
- Native browser API
- Async/await
- Request/response
- Error handling

### Development Tools

**pnpm**
- Fast package manager
- Disk space efficient
- Strict dependencies
- Monorepo support

**ESLint**
- Code linting
- Style enforcement
- Error detection
- Custom rules

**Prettier**
- Code formatting
- Consistent style
- Auto-fix
- Integration with editors

## Blockchain

### Smart Contracts

**ink! 4.3+**
- Rust-based DSL
- WebAssembly target
- Substrate compatible
- Type-safe
- Small binaries

**cargo-contract**
- Build tool
- Contract compilation
- Deployment
- Testing
- Optimization

**Substrate Contracts Node**
- Local development
- Contract testing
- Fast iteration
- Debug support

### Network

**Polkadot Rococo**
- Testnet environment
- Smart contract support
- Free test tokens
- Faucet available
- Similar to mainnet

## Development Tools

### Containerization

**Docker 20.10+**
- Container runtime
- Image building
- Multi-stage builds
- Volume management

**Docker Compose 2.0+**
- Multi-container orchestration
- Service definition
- Network configuration
- Volume management

### Build Tools

**Make**
- Task automation
- Command shortcuts
- Build scripts
- Cross-platform

**cargo**
- Rust build tool
- Dependency management
- Testing
- Documentation

### Version Control

**Git**
- Source control
- Branch management
- Collaboration
- History tracking

### Code Quality

**mypy**
- Static type checking
- Type inference
- Error detection
- Python type hints

**black**
- Code formatter
- PEP 8 compliant
- Automatic formatting
- Consistent style

**isort**
- Import sorting
- Automatic organization
- Configurable
- Black compatible

## Infrastructure (Future)

### Cloud Providers

**AWS / GCP / Azure**
- Compute instances
- Managed databases
- Object storage
- CDN
- Load balancing

### Monitoring

**Prometheus**
- Metrics collection
- Time-series database
- Alerting
- Grafana integration

**Grafana**
- Metrics visualization
- Dashboards
- Alerting
- Multiple data sources

**Sentry**
- Error tracking
- Performance monitoring
- Release tracking
- User feedback

### CI/CD

**GitHub Actions**
- Automated testing
- Build pipeline
- Deployment
- Workflow automation

### Security

**Let's Encrypt**
- SSL/TLS certificates
- Automatic renewal
- Free
- Trusted

**Cloudflare**
- DDoS protection
- CDN
- DNS management
- SSL/TLS

## Development Environment

### Required

- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- Node.js 18+
- Python 3.11+
- Rust 1.70+

### Recommended

- VS Code or similar IDE
- Postman or Insomnia (API testing)
- DBeaver or pgAdmin (database)
- Redis Commander (Redis GUI)
- Polkadot.js Apps (blockchain explorer)

### Optional

- cargo-contract (smart contract development)
- substrate-contracts-node (local blockchain)
- binaryen (WebAssembly optimization)

## Package Managers

### Backend

**pip**
- Python package manager
- requirements.txt
- Virtual environments

### Frontend

**pnpm**
- Fast, efficient
- Disk space saving
- Strict mode
- Workspace support

### Smart Contracts

**cargo**
- Rust package manager
- Dependency resolution
- Build system
- Testing framework

## Testing Tools

### Backend

**pytest**
- Unit testing
- Integration testing
- Fixtures
- Async support

**pytest-cov**
- Code coverage
- Coverage reports
- Branch coverage

**httpx**
- HTTP testing
- Async client
- Mock responses

### Frontend

**Jest** (Future)
- Unit testing
- Snapshot testing
- Mocking
- Coverage

**React Testing Library** (Future)
- Component testing
- User-centric
- Accessibility
- Best practices

### Smart Contracts

**ink! testing**
- Unit tests
- Integration tests
- Mock environment
- Coverage

## Documentation Tools

**OpenAPI/Swagger**
- API specification
- Interactive docs
- Code generation
- Validation

**Markdown**
- Documentation format
- README files
- Easy to read
- Version controlled

**Mermaid**
- Diagram generation
- Sequence diagrams
- Flowcharts
- ER diagrams

