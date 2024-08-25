# Contributing to WeChat Job Bot

We're thrilled that you're interested in contributing to the WeChat Job Bot project! This document provides guidelines and information on how to contribute.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
4. [Issues](#issues)
5. [Adding New Job Providers](#adding-new-job-providers)
6. [Style Guide](#style-guide)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [project_email@example.com].

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Set up the development environment by following the instructions in the README.md file.

## How to Contribute

1. Look for open issues, especially those labeled "good first issue" if you're new to the project.
2. Create a new branch for your contribution:
   ```
   git checkout -b feature/YourFeatureName
   ```
3. Make your changes and commit them with a clear commit message.
4. Push your changes to your fork:
   ```
   git push origin feature/YourFeatureName
   ```
5. Create a pull request from your fork to the main repository.

## Issues

Issues are a great way to contribute to the project, even if you're not writing code. Here's how you can use issues:

- **Good First Issues**: Look for issues labeled "good first issue". These are typically simpler tasks that are good for newcomers to the project.

- **Requesting Features**: If you have an idea for a new feature, create an issue with the label "feature request". Describe the feature in detail, including why you think it would be valuable.

- **Reporting Bugs**: If you find a bug, create an issue with the label "bug". Include as much detail as possible, such as:

  - Steps to reproduce the bug
  - Expected behavior
  - Actual behavior
  - Any error messages or logs
  - Your environment (OS, Node.js version, etc.)

- **Discussing Ideas**: Use issues to discuss potential changes or improvements before starting work on them.

## Adding New Job Providers

To add a new job provider:

1. Create a new file in the `providers` directory (e.g., `my-new-provider.ts`).
2. Implement the `JobProvider` interface.
3. Add the new provider to the `jobProviders` array in the main bot file.

Example:

```typescript
import { JobProvider, JobType, Job } from '../types';

export class MyNewProvider implements JobProvider {
  jobType = JobType.INTERN; // or JobType.NEW_GRAD

  async getNewJobs(roomTopic: string): Promise<Job[]> {
    // Implementation
  }

  formatJobMessages(jobs: Job[]): string[] {
    // Implementation
  }

  async getAllSentJobMessages(roomTopic: string): Promise<Job[]> {
    // Implementation
  }
}
```

Make sure to:

- Handle errors gracefully
- Add appropriate logging
- Write unit tests for your new provider

## Style Guide

We follow a set of style guidelines to maintain consistency across the project:

- **TypeScript**: We use TypeScript for type safety. Ensure all new code is properly typed.

- **ESLint**: We use ESLint for linting. Run `yarn lint` before submitting your PR to ensure your code adheres to our ESLint configuration.

- **Prettier**: We use Prettier for code formatting. Run `yarn format` to automatically format your code.

- **Naming Conventions**:

  - Use `camelCase` for variable and function names
  - Use `PascalCase` for class names and interfaces
  - Use `UPPER_CASE` for constants

- **Comments**: Write clear comments for complex logic. Use JSDoc comments for functions and classes.

- **File Structure**: Keep files focused on a single responsibility. If a file grows too large, consider splitting it into multiple files.

- **Imports**: Group imports in the following order:

  1. Node.js built-in modules
  2. External modules
  3. Internal modules
  4. Relative imports

- **Error Handling**: Use try-catch blocks for error handling. Log errors appropriately.

- **Asynchronous Code**: Use `async/await` instead of callbacks or raw promises when possible.

Thank you for contributing to WeChat Job Bot!
