# ?? HPC Dashboard

<div align="center">

![Kamiak GUI](https://github.com/user-attachments/assets/da810c82-e3fe-4868-8704-f651042f5407)

**A modern, web-based interface for the Kamiak HPC Cluster.**  
Replaces complex command-line interactions with an intuitive, powerful graphical dashboard.

[Features](#-key-features) • [Installation](#-installation) • [LLM Integration](#-llm-integration) • [Tech Stack](#-technology-stack)

</div>

---

## ? Key Features

### ??? Cluster Management
*   **Secure Auth**: SSH-based login with password or private key support.
*   **File Manager**: deeply integrated file browsing, editing (code/syntax highlighting), and safe deletion.
*   **Web Terminal**: Instant access to a remote shell for quick commands.

### ? Job Orchestration (Slurm)
*   **Visual Job Composer**: Create SBATCH scripts using templates (Standard/GPU) without memorizing flags.
*   **Live Monitoring**: Real-time view of active queues (`squeue`) and historical jobs (`sacct`).
*   **Control**: Cancel running jobs instantly with one click.

### ?? LLM Studio (New!)
Turn your HPC allocation into a private AI playground.
*   **One-Click Server**: Deploys a Flask-based LLM server on a GPU node automatically.
*   **Custom Models**: Run Llama 3, Mistral, Gemma 7B, and more.
*   **RAG / Context**: Upload documents (`.pdf`, `.docx`, `.txt`) to chat with your data.
*   **Markdown Chat**: Rich text formatting for code blocks, tables, and lists.
*   **Manage Models**: View and delete cached HuggingFace models to save disk space.

---

## ??? Installation

### Prerequisites
*   **Node.js 18+**
*   Access to an HPC cluster (via SSH)

### Quick Start

1.  **Clone the Repo**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to launch.

---

## ?? LLM Integration Guide

The **LLM Tab** provides a complete interface for running local LLMs on the cluster.

### 1. Start Server
Select your desired model (e.g., `meta-llama/Meta-Llama-3-8B`) and click **Start LLM Server**.
*   *What happens?* An SBATCH job is submitted to allocate a GPU node. Once running, an SSH tunnel is automatically established to your local machine.

### 2. Chat & RAG
*   **Chat**: Interact naturally with the model.
*   **Upload Context**: Click the ?? icon to upload PDFs or text files. The model will use this content to answer your questions.
*   **Clear Chat**: Use the "Clear Chat / Reset Context" button to wipe history and forget uploaded files.

### 3. Manage Cache
Navigate to the **Manage LLMs** sub-tab to view models stored in `$HOME/.cache/huggingface/hub`. You can delete old models here to free up your user quota.

---

## ?? Deployment (Standalone)

For production deployment without `node_modules` dependency hell:

1.  **Build**
    ```bash
    npm run build
    ```
2.  **Deploy**
    Copy the `.next/standalone` folder to your server.
    *   *Note*: Ensure you also copy `.next/static` -> `.next/standalone/.next/static` and `public` -> `.next/standalone/public`.

3.  **Run**
    ```bash
    node server.js
    ```

---

## ?? Technology Stack

*   **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
*   **Backend Ops**: SSH2 (Node.js), Slurm Workload Manager
*   **AI Backend**: Python, Flask, HuggingFace Transformers, PyTorch

---

<div align="center">
  <sub>Built for the Kamiak Cluster</sub>
</div>
