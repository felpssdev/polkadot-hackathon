.PHONY: help up down logs restart backend frontend db init-db clean

help: ## Mostra esta ajuda
	@echo "Comandos disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Sobe todos os serviços
	docker-compose up -d
	@echo "✅ Serviços iniciados!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

down: ## Para todos os serviços
	docker-compose down

logs: ## Mostra logs de todos os serviços
	docker-compose logs -f

logs-backend: ## Mostra logs do backend
	docker-compose logs -f backend

logs-frontend: ## Mostra logs do frontend
	docker-compose logs -f frontend

restart: ## Reinicia todos os serviços
	docker-compose restart

restart-backend: ## Reinicia apenas o backend
	docker-compose restart backend

restart-frontend: ## Reinicia apenas o frontend
	docker-compose restart frontend

build: ## Reconstrói as imagens Docker
	docker-compose build

init-db: ## Inicializa o banco de dados
	docker-compose exec backend python scripts/init_db.py

backend-shell: ## Abre shell no container do backend
	docker-compose exec backend bash

db-shell: ## Abre shell do PostgreSQL
	docker-compose exec db psql -U polkapay -d polkapay

clean: ## Remove containers, volumes e imagens
	docker-compose down -v
	docker system prune -f

status: ## Mostra status dos serviços
	docker-compose ps

test-api: ## Testa a API
	@echo "Testing API..."
	@curl -s http://localhost:8000/health | python -m json.tool
	@echo ""
	@curl -s http://localhost:8000/api/v1/orders/rates/exchange | python -m json.tool

install-backend: ## Instala dependências do backend localmente
	cd backend && pip install -r requirements.txt

install-frontend: ## Instala dependências do frontend localmente
	cd frontend && npm install

dev-backend: ## Roda backend localmente (sem Docker)
	cd backend && uvicorn app.main:app --reload

dev-frontend: ## Roda frontend localmente (sem Docker)
	cd frontend && npm run dev

compile-contract: ## Compila o smart contract
	cd backend/contracts && cargo contract build --release

