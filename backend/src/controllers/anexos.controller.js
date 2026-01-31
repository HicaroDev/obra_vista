const anexosService = require('../services/anexos.service');

class AnexosController {
    /**
     * GET /api/atribuicoes/:id/anexos
     * Listar anexos de uma atribuição
     */
    async getByAtribuicao(req, res, next) {
        try {
            const { id } = req.params;
            const anexos = await anexosService.getByAtribuicao(id);

            res.status(200).json({
                success: true,
                data: anexos,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/atribuicoes/:id/anexos
     * Upload de anexo
     */
    async upload(req, res, next) {
        try {
            const { id } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo enviado',
                });
            }

            const anexo = await anexosService.create(id, file);

            res.status(201).json({
                success: true,
                message: 'Upload realizado com sucesso',
                data: anexo,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/anexos/:id
     * Deletar anexo
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;

            const result = await anexosService.delete(id);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AnexosController();
