FROM ubuntu:22.04

WORKDIR /backend

RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    build-essential \
    python3 \
    python3-pip \
    cmake \
    unzip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://go.dev/dl/go1.23.1.linux-arm64.tar.gz && \
    tar -C /usr/local -xzf go1.23.1.linux-arm64.tar.gz && \
    rm go1.23.1.linux-arm64.tar.gz


ENV PATH="/usr/local/go/bin:${PATH}"


RUN go version

COPY pythonFacialRec/requirements.txt /backend
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

RUN go install github.com/air-verse/air@latest

EXPOSE 3000

#comment out for development purposes
CMD ["make", "watch"]


