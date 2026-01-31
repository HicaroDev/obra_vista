-- Script para criar as tabelas do Obra Vista no Supabase
-- Execute este script diretamente no SQL Editor do Supabase

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'usuario' NOT NULL,
    ativo BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);

-- Tabela de Prestadores
CREATE TABLE IF NOT EXISTS public.prestadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    especialidade VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    email VARCHAR(255),
    cpf VARCHAR(14) UNIQUE,
    ativo BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prestadores_cpf ON public.prestadores(cpf);

-- Tabela de Equipes
CREATE TABLE IF NOT EXISTS public.equipes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#3B82F6',
    ativa BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de Equipes_Membros
CREATE TABLE IF NOT EXISTS public.equipes_membros (
    id SERIAL PRIMARY KEY,
    "equipeId" INTEGER NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
    "usuarioId" INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    "prestadorId" INTEGER REFERENCES public.prestadores(id) ON DELETE CASCADE,
    papel VARCHAR(50) DEFAULT 'membro' NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE("equipeId", "usuarioId"),
    UNIQUE("equipeId", "prestadorId")
);

CREATE INDEX IF NOT EXISTS idx_equipes_membros_equipeId ON public.equipes_membros("equipeId");
CREATE INDEX IF NOT EXISTS idx_equipes_membros_usuarioId ON public.equipes_membros("usuarioId");
CREATE INDEX IF NOT EXISTS idx_equipes_membros_prestadorId ON public.equipes_membros("prestadorId");

-- Tabela de Obras
CREATE TABLE IF NOT EXISTS public.obras (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(500) NOT NULL,
    descricao TEXT,
    status VARCHAR(50) DEFAULT 'planejamento' NOT NULL,
    "dataInicio" TIMESTAMP,
    "dataFim" TIMESTAMP,
    orcamento DECIMAL(10, 2),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_obras_status ON public.obras(status);

-- Tabela de Atribuições (Kanban)
CREATE TABLE IF NOT EXISTS public.atribuicoes (
    id SERIAL PRIMARY KEY,
    "obraId" INTEGER NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    "equipeId" INTEGER NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(50) DEFAULT 'a_fazer' NOT NULL,
    prioridade VARCHAR(50) DEFAULT 'media' NOT NULL,
    ordem INTEGER DEFAULT 0 NOT NULL,
    "dataInicio" TIMESTAMP,
    "dataFim" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_atribuicoes_obraId ON public.atribuicoes("obraId");
CREATE INDEX IF NOT EXISTS idx_atribuicoes_equipeId ON public.atribuicoes("equipeId");
CREATE INDEX IF NOT EXISTS idx_atribuicoes_status ON public.atribuicoes(status);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_ordem ON public.atribuicoes(ordem);

-- Tabela de Logs
CREATE TABLE IF NOT EXISTS public.logs (
    id SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    "atribuicaoId" INTEGER REFERENCES public.atribuicoes(id) ON DELETE SET NULL,
    acao VARCHAR(50) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    detalhes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_usuarioId ON public.logs("usuarioId");
CREATE INDEX IF NOT EXISTS idx_logs_atribuicaoId ON public.logs("atribuicaoId");
CREATE INDEX IF NOT EXISTS idx_logs_entidade ON public.logs(entidade);
CREATE INDEX IF NOT EXISTS idx_logs_createdAt ON public.logs("createdAt");

-- Trigger para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prestadores_updated_at BEFORE UPDATE ON public.prestadores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipes_updated_at BEFORE UPDATE ON public.equipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atribuicoes_updated_at BEFORE UPDATE ON public.atribuicoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
