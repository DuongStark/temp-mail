# TempMail.art

<div align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" />
  <br/>
  <p>A modern, high-performance temporary email service built with Next.js.</p>
  <a href="https://temp-mail-ten.vercel.app"><strong>View Live Demo</strong></a>
</div>

---

## Overview

TempMail.art is a minimal, privacy-focused web application that provides instant disposable email addresses. Designed to protect primary inboxes from spam, it features a real-time polling mechanism and a premium dark-themed interface.

## Key Features

- **Instant Generation**: Create unique, disposable email addresses on demand.
- **Real-time Synchronization**: Automatic inbox polling (every 5 seconds) for seamless email reception.
- **Smart Parsing**: Robust MIME/Multipart parsing to extract plain text cleanly.
- **Modern Interface**: Premium dark UI constructed with a focus on typography and responsive design.
- **Privacy Centric**: Operates without registration or persistent data collection.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Custom design system)
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18.x or newer
- npm, yarn, or pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/duongstark/temp-mail.git
cd temp-mail
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_DOMAIN="yourdomain.com"
NEXT_PUBLIC_API="https://your-api-endpoint.com"
```

4. Run the development server
```bash
npm run dev
```

Navigate to `http://localhost:3000` to view the application.

## Architecture

The application relies on Next.js Client Components to manage state and periodic polling. It interfaces with a backend API (e.g. Cloudflare Workers) to fetch incoming emails. Environment variables are strictly prefixed with `NEXT_PUBLIC_` to ensure availability within the browser bundle.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
