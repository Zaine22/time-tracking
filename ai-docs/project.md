# Time Tracking System

## Goal
A system to track staff working hours per project, generate reports, and calculate payments based on approval status.

## Tech Stack
- Next.js
- PostgreSQL
- Prisma ORM

## Roles
- SUPERADMIN
- ADMIN
- STAFF
- ACCOUNTING

## Core Rules
- Staff must log time under assigned projects only
- Daily reports must be submitted within 48 hours
- Submitted reports cannot be edited
- Late reports receive reduced payment (50%)
- Cost changes only apply to future logs