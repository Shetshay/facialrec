FROM ubuntu:22.04

WORKDIR /pythonserver

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
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /pythonserver
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 4269

CMD ["python3", "-u", "server.py"]
