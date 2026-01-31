-- Adicionar campos para CPF/CNPJ no prestadores
ALTER TABLE prestadores 
ADD COLUMN IF NOT EXISTS tipo_pessoa VARCHAR(2) DEFAULT 'PF' CHECK (tipo_pessoa IN ('PF', 'PJ')),
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18) UNIQUE;

-- Criar índice para CNPJ
CREATE INDEX IF NOT EXISTS idx_prestadores_cnpj ON prestadores(cnpj);

-- Comentários
COMMENT ON COLUMN prestadores.tipo_pessoa IS 'PF = Pessoa Física, PJ = Pessoa Jurídica';
COMMENT ON COLUMN prestadores.cpf IS 'CPF para Pessoa Física';
COMMENT ON COLUMN prestadores.cnpj IS 'CNPJ para Pessoa Jurídica';
