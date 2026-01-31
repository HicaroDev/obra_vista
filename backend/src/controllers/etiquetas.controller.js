const etiquetasService = require('../services/etiquetas.service');

class EtiquetasController {
    /**
     * GET /api/etiquetas
     */
    async getAll(req, res, next) {
        try {
            const etiquetas = await etiquetasService.getAll();
            res.status(200).json({ success: true, data: etiquetas });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/etiquetas
     */
    async create(req, res, next) {
        try {
            const { nome, cor } = req.body;
            if (!nome) throw new Error('Nome é obrigatório');

            const etiqueta = await etiquetasService.create({ nome, cor });
            res.status(201).json({ success: true, data: etiqueta });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/etiquetas/:id
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await etiquetasService.delete(id);
            res.status(200).json({ success: true, message: 'Etiqueta removida' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/etiquetas/tarefa/:id
     */
    async getByTarefa(req, res, next) {
        try {
            const { id } = req.params;
            const etiquetas = await etiquetasService.getByTarefa(id);
            res.status(200).json({ success: true, data: etiquetas });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/etiquetas/tarefa/:id
     */
    async addToTarefa(req, res, next) {
        try {
            const { id } = req.params;
            const { etiquetaId } = req.body;
            if (!etiquetaId) throw new Error('ID da etiqueta é obrigatório');

            const vinculo = await etiquetasService.addToTarefa(id, etiquetaId);
            res.status(201).json({ success: true, data: vinculo });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/etiquetas/tarefa/:id/:etiquetaId
     */
    async removeFromTarefa(req, res, next) {
        try {
            const { id, etiquetaId } = req.params;
            await etiquetasService.removeFromTarefa(id, etiquetaId);
            res.status(200).json({ success: true, message: 'Etiqueta desvinculada' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EtiquetasController();
