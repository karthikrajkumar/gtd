# GTD Workspace Image — Runs inside each sandbox container.
#
# Contains: Node.js, git, GTD framework, MCP bridge.
# Entrypoint starts the MCP bridge which spawns gtd-mcp-server.cjs.

FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install GTD framework globally
RUN npm install -g @karthikrajkumar.kannan/get-things-done@latest

# Create non-root user
RUN groupadd -r gtd && useradd -r -g gtd -m -s /bin/bash gtd

# Create workspace directory
RUN mkdir -p /workspace && chown gtd:gtd /workspace

# Copy MCP bridge
# (In production, compile mcp-bridge.ts to JS and COPY it here.
#  For now, we copy the TS source and run with tsx.)
COPY src/mcp/mcp-bridge.ts /usr/local/bin/mcp-bridge.ts

# Entrypoint script: optional git clone, then start MCP bridge
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Environment
ENV GTD_PROJECT=/workspace
ENV MCP_BRIDGE_PORT=3100
ENV GTD_MCP_PATH=/usr/local/lib/node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs
ENV NODE_ENV=production

EXPOSE 3100

USER gtd
WORKDIR /workspace

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
