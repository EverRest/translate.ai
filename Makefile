.PHONY: help install install-backend install-frontend \
	lint lint-backend lint-frontend format format-check \
	typecheck typecheck-backend typecheck-frontend \
	test test-backend test-frontend test-e2e test-e2e-frontend test-e2e-translation \
	test-smoke test-performance test-cov \
	smoke perf \
	build build-backend build-frontend \
	ci ci-backend ci-frontend \
	dev-infra dev-backend dev-worker dev-frontend dev \
	db-migrate db-generate db-studio db-push db-seed \
	docker-env docker-up docker-down docker-ollama docker-app clean hooks-install pre-commit

SHELL := /bin/bash
BACKEND := backend
FRONTEND := frontend

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: install-backend install-frontend ## Install all dependencies

hooks-install: ## Point git at .husky hooks (run after git init)
	git config core.hooksPath .husky
	@chmod +x .husky/pre-commit scripts/pre-commit.sh scripts/seed-admin.sh scripts/setup-docker-env.sh
	@echo "Git hooks path set to .husky/"

install-backend: ## npm ci in backend
	cd $(BACKEND) && npm ci

install-frontend: ## npm ci in frontend
	cd $(FRONTEND) && npm ci

lint: lint-backend lint-frontend ## Run linters (check mode)

lint-backend: ## ESLint backend (no auto-fix)
	cd $(BACKEND) && npm run lint:check

lint-frontend: ## ESLint + oxlint frontend (check mode)
	cd $(FRONTEND) && npm run lint:check

format: ## Format all code with Prettier
	cd $(BACKEND) && npm run format
	cd $(FRONTEND) && npm run format

format-check: ## Verify formatting without writing
	cd $(BACKEND) && npm run format:check
	cd $(FRONTEND) && npm run format:check

typecheck: typecheck-backend typecheck-frontend ## TypeScript check both apps

typecheck-backend:
	cd $(BACKEND) && npm run typecheck

typecheck-frontend:
	cd $(FRONTEND) && npm run typecheck

test: test-backend test-frontend ## Run unit tests

test-backend:
	cd $(BACKEND) && npm test

test-frontend:
	cd $(FRONTEND) && npm test

test-e2e: ## Backend e2e tests (requires postgres + redis)
	cd $(BACKEND) && npm run test:e2e

test-e2e-translation: ## Backend translation flow e2e (job → worker → export)
	cd $(BACKEND) && MOCK_TRANSLATIONS=true npm run test:e2e -- --testPathPatterns=translation-flow

test-smoke: ## Backend smoke e2e tests
	cd $(BACKEND) && npm run test:e2e -- --testPathPattern=smoke

test-performance: ## Backend performance e2e tests
	cd $(BACKEND) && npm run test:e2e -- --testPathPattern=performance

test-e2e-frontend: ## Playwright UI e2e (requires postgres + redis)
	bash scripts/e2e-frontend.sh

smoke: ## Live API smoke test (requires running API)
	bash scripts/smoke-test.sh

perf: ## Live API performance test (requires running API)
	node scripts/performance-test.mjs

test-cov: ## Unit tests with coverage
	cd $(BACKEND) && npm run test:cov
	cd $(FRONTEND) && npm run test:cov

build: build-backend build-frontend ## Production build both apps

build-backend:
	cd $(BACKEND) && npm run build

build-frontend:
	cd $(FRONTEND) && npm run build

ci-backend: ## Backend CI pipeline (lint, typecheck, build, test, e2e)
	cd $(BACKEND) && npm run lint:check
	cd $(BACKEND) && npm run format:check
	cd $(BACKEND) && npm run typecheck
	cd $(BACKEND) && npx prisma generate
	cd $(BACKEND) && npm run build
	cd $(BACKEND) && npm test -- --coverage --passWithNoTests
	cd $(BACKEND) && npm run test:e2e

ci-frontend: ## Frontend CI pipeline
	cd $(FRONTEND) && npm run lint:check
	cd $(FRONTEND) && npm run format:check
	cd $(FRONTEND) && npm run typecheck
	cd $(FRONTEND) && npm test
	cd $(FRONTEND) && npm run build

pre-commit: ## Run the same checks as the git pre-commit hook
	bash scripts/pre-commit.sh

ci: lint format-check typecheck test build ## Quick CI (no e2e / docker)
	@echo "CI checks passed."

dev-infra: ## Start postgres + redis
	docker compose up -d postgres redis

dev-backend: ## NestJS API watch mode
	cd $(BACKEND) && npm run start:dev

dev-worker: ## BullMQ worker watch mode
	cd $(BACKEND) && npm run start:worker

dev-frontend: ## Vite dev server
	cd $(FRONTEND) && npm run dev

dev: dev-infra ## Print dev startup hints
	@echo "Run in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-worker"
	@echo "  make dev-frontend"

db-generate: ## Prisma generate
	cd $(BACKEND) && npm run prisma:generate

db-migrate: ## Prisma migrate dev
	cd $(BACKEND) && npm run prisma:migrate

db-push: ## Prisma db push (dev)
	cd $(BACKEND) && npx prisma db push

db-seed: ## Seed default admin user (ADMIN_EMAIL / ADMIN_PASSWORD)
	bash scripts/seed-admin.sh

docker-env: ## Copy .env.docker templates to backend/.env and frontend/.env
	bash scripts/setup-docker-env.sh

docker-app: docker-env ## Build and start full stack (postgres, redis, api, worker, frontend)
	docker compose up -d --build postgres redis api worker frontend

docker-ollama-app: docker-env ## Full stack + Ollama for local AI translation
	docker compose --profile ollama up -d --build postgres redis api worker frontend ollama

db-studio: ## Prisma Studio
	cd $(BACKEND) && npm run prisma:studio

docker-up: ## docker compose up -d (core services)
	docker compose up -d postgres redis

docker-down: ## docker compose down
	docker compose down

docker-ollama: ## docker compose with ollama profile
	docker compose --profile ollama up -d

clean: ## Remove build artifacts
	rm -rf $(BACKEND)/dist $(BACKEND)/coverage $(FRONTEND)/dist
