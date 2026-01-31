-- Criar tabela de Especialidades
CREATE TABLE IF NOT EXISTS public.especialidades (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) UNIQUE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inserir algumas especialidades iniciais se não existirem
INSERT INTO public.especialidades (nome) 
VALUES 
    ('Pedreiro'), 
    ('Eletricista'), 
    ('Encanador'), 
    ('Pintor'), 
    ('Carpinteiro'), 
    ('Mestre de Obras'), 
    ('Engenheiro'), 
    ('Arquiteto')
ON CONFLICT (nome) DO NOTHING;
