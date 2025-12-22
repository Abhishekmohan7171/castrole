FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install FFmpeg and required tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Google Cloud SDK (lightweight method)
RUN curl -sSL https://sdk.cloud.google.com | bash
ENV PATH="/root/google-cloud-sdk/bin:${PATH}"

# Install Python dependencies for Firestore
RUN pip3 install --no-cache-dir \
    google-cloud-storage \
    google-cloud-firestore

# Set working directory
WORKDIR /app

# Copy encoder script
COPY encode.py /app/encode.py
RUN chmod +x /app/encode.py

# Set entrypoint
ENTRYPOINT ["python3", "/app/encode.py"]
