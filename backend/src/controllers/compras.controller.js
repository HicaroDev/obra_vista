const comprasService = require('../services/compras.service');

class ComprasController {
    async listByTarefa(req, res, next) {
        try {
            const { id } = req.params;
            const compras = await comprasService.listByTarefa(id);
            res.json({ success: true, data: compras });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const { id } = req.params;
            const compra = await comprasService.create({ ...req.body, atribuicaoId: id });
            res.status(201).json({ success: true, data: compra });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const compra = await comprasService.update(id, req.body);
            res.json({ success: true, data: compra });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await comprasService.delete(id);
            res.json({ success: true, message: 'Item de compra removido com sucesso' });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const compra = await comprasService.updateStatus(id, status);
            res.json({ success: true, data: compra });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ComprasController();
