# Branching Strategy

## 1. Overview

This document defines the Git branching workflow for our CS6620 Final Project team.

Goals:
- Keep main stable and production-ready.
- Allow parallel development using short-lived feature branches.
- Make it clear how code goes from local changes → PR → dev → main.

We follow a lightweight “GitHub Flow + protected main” style process.

---

## 2. Branch Types

### main
- Stable branch.
- Only reviewed and tested code is merged here.
- Used for demos, final submission, and any deployments.
- No direct pushes by team members (team rule).

### dev
- Shared integration branch.
- Used when multiple features need to be tested together.
- Code should build and run, but may not be final.

### feature/*
Naming convention:
feature/<short-description>
feature/<ticket-id>-<short-description>

Examples:
feature/backend-profile-api
feature/frontend-chat-ui
feature/infra-terraform-vpc

Rules:
- Always branch from dev.
- One feature / fix per branch.
- Delete branch after merge.

---

## 3. Basic Workflow

1. Checkout from dev
2. Implement changes
3. Open Pull Request (PR)
4. PR must be reviewed
5. CI must pass
6. Merge using “Squash and merge”
7. Delete branch

---

## 4. Branch Protection Rules

Target protections for main:
- No direct pushes
- PR required for all changes
- At least one approving review
- CI checks must pass

GitHub Classroom limitation:
We currently cannot configure protection rules (no settings access).
Therefore:
- These rules are documented as team policy
- CI pipelines will enforce as much as possible
- If instructor enables settings later, we will apply them

---

## 5. Commit & PR Conventions

Commit messages:
- Short and descriptive

PR titles:
- Clear and scoped, e.g.:
  [Backend] Implement /profile
  [Infra] Add VPC Terraform

PR description:
- Follow the PR template
- Include what changed
- Include test steps
- Include Notion ticket link