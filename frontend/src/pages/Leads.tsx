
import { useState, useEffect } from 'react';
import {
    PiUserPlus, PiMagnifyingGlass, PiSpinner, PiPencil, PiTrash,
    PiPhone, PiEnvelope, PiBuildings, PiUser, PiPlus, PiX
} from 'react-icons/pi';
import { crmApi } from '../lib/api';
import { toast } from 'sonner';

export function Leads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<any>(null);

    // Form states
    const [nome, setNome] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [documento, setDocumento] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const response = await crmApi.leads.getAll();
            if (response.success) setLeads(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar leads');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (lead: any) => {
        setEditingLead(lead);
        setNome(lead.nome);
        setEmpresa(lead.empresa || '');
        setEmail(lead.email || '');
        setTelefone(lead.telefone || '');
        setDocumento(lead.documento || '');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLead(null);
        setNome('');
        setEmpresa('');
        setEmail('');
        setTelefone('');
        setDocumento('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = { nome, empresa, email, telefone, documento };
            let res;
            if (editingLead) {
                res = await crmApi.leads.update(editingLead.id, data);
                if (res.success) toast.success('Lead atualizado com sucesso');
            } else {
                res = await crmApi.leads.create(data);
                if (res.success) toast.success('Lead criado com sucesso');
            }
            loadLeads();
            handleCloseModal();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar lead');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este lead? Isso removerá todos os negócios vinculados.')) return;
        try {
            await crmApi.leads.delete(id);
            toast.success('Lead excluído');
            loadLeads();
        } catch (error) {
            toast.error('Erro ao excluir lead');
        }
    };

    const filteredLeads = leads.filter(l =>
        l.nome.toLowerCase().includes(search.toLowerCase()) ||
        (l.empresa && l.empresa.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Leads & Clientes</h1>
                    <p className="text-gray-500 mt-1">Gerencie sua base de contatos comerciais</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
                >
                    <PiUserPlus size={20} /> Novo Lead
                </button>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 relative">
                    <PiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, empresa ou e-mail..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black text-gray-900">{leads.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <PiUser size={24} />
                    </div>
                </div>
            </div>

            {/* Leads List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nome / Empresa</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contato</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Documento</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <PiSpinner className="animate-spin text-blue-600 mx-auto" size={48} />
                                        <p className="text-gray-400 mt-4 font-medium">Carregando base de dados...</p>
                                    </td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                                        Nenhum lead encontrado.
                                    </td>
                                </tr>
                            ) : filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                {lead.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-base">{lead.nome}</p>
                                                {lead.empresa && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                                        <PiBuildings size={14} /> {lead.empresa}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            {lead.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <PiEnvelope className="text-gray-400" /> {lead.email}
                                                </div>
                                            )}
                                            {lead.telefone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <PiPhone className="text-gray-400" /> {lead.telefone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-gray-500">{lead.documento || '-'}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(lead)}
                                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Editar"
                                            >
                                                <PiPencil size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Excluir"
                                            >
                                                <PiTrash size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Novo/Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">{editingLead ? 'Editar Lead' : 'Cadastrar Novo Lead'}</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <PiX size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Nome Completo / Contato Principal</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="Nome do cliente"
                                        value={nome}
                                        onChange={e => setNome(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 font-bold tracking-tight">Nome da Empresa (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="Razão social ou nome fantasia"
                                        value={empresa}
                                        onChange={e => setEmpresa(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 font-bold tracking-tight">E-mail Comercial</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="cliente@exemplo.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 font-bold tracking-tight">Telefone / WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="(00) 00000-0000"
                                        value={telefone}
                                        onChange={e => setTelefone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 font-bold tracking-tight">CPF / CNPJ</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="Apenas números"
                                    value={documento}
                                    onChange={e => setDocumento(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 disabled:bg-gray-400"
                                >
                                    {submitting ? <PiSpinner className="animate-spin" size={24} /> : editingLead ? <PiPencil size={24} /> : <PiPlus size={24} />}
                                    {editingLead ? 'Salvar Alterações' : 'Cadastrar Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
