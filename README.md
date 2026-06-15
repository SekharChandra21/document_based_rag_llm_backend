# :gear: Backend Development

## Responsibilities

### RAG Pipeline Development
- Built an end-to-end Retrieval-Augmented Generation architecture.
- Integrated retrieval and generation workflows.
- Improved response accuracy through contextual augmentation.

### Document Ingestion Pipeline
- Extracted text from uploaded PDF documents.
- Performed text preprocessing and cleaning.
- Implemented chunking strategies for efficient retrieval.

### Embedding Generation
- Generated vector embeddings for document chunks.
- Converted user queries into embeddings.
- Enabled semantic understanding of documents and queries.

### Vector Database Integration
- Integrated Pinecone Vector Database.
- Stored and managed document embeddings.
- Implemented similarity search for retrieval.

### Semantic Retrieval
- Retrieved top relevant document chunks.
- Used vector similarity search techniques.
- Optimized retrieval quality and response relevance.

### LLM Integration
- Integrated Large Language Models for answer generation.
- Passed retrieved context to LLMs.
- Generated grounded and context-aware responses.

### Agent-Based Query Processing
- Developed Planner Agent for workflow orchestration.
- Implemented Retrieval Agent for information gathering.
- Designed Response Agent for final answer synthesis.

### Workflow Automation
- Automated ingestion and indexing processes using n8n.
- Reduced manual intervention in document processing.
- Streamlined backend operations.

### API Development
- Built REST APIs for:
  - Document Upload
  - Query Processing
  - Search Retrieval
  - Chat History Management
  - Metadata Management

### Database Management
- Managed document metadata using MongoDB.
- Stored indexing information and document status.
- Maintained efficient data organization.

## Backend Tech Stack

- Node.js
- Express.js
- MongoDB
- MongoDB Vector Database
- OpenAI APIs / LLM APIs
- n8n
- REST APIs

---

# :building_construction: System Architecture

```text
User Query
    │
    ▼
Frontend (React)
    │
    ▼
Backend API (Node.js)
    │
    ▼
Planner Agent
    │
    ├── Retrieval Agent
    │         │
    │         ▼
    │    MongoDB Vector DB
    │
    ▼
LLM Response Generation
    │
    ▼
Context-Aware Response
