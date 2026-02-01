import { useState, useEffect } from 'react';
import type { Prestador } from '../types';
import { prestadoresApi, especialidadesApi } from '../lib/api';
import { maskCPF, maskCNPJ, maskPhone, removeMask } from '../lib/masks';
import { useAuthStore } from '../store/authStore';
import { canPerformAction } from '../lib/permissions';
import {
    PiBriefcase as Briefcase,
    PiPlus as Plus,
    PiMagnifyingGlass as Search,
    PiPencilSimple as Edit2,
    PiTrash as Trash2,
    PiPhone as Phone,
    PiEnvelope as Mail,
    PiFileText as FileText,
    PiSpinner as Loader2,
    PiX as X,
    PiUserCheck as UserCheck,
    PiUserMinus as UserX,
    PiWallet as Wallet
} from 'react-icons/pi';

export function Prestadores() {
    const { user } = useAuthStore();
    const [prestadores, setPrestadores] = useState<Prestador[]>([]);
    // ... rest of state ...
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPrestador, setEditingPrestador] = useState<Prestador | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        especialidade: '',
        telefone: '',
        email: '',
        tipoPessoa: 'PF', // PF = Pessoa Física, PJ = Pessoa Jurídica
        cpf: '',
        cnpj: '',
        pixTipo: '',
        pixChave: '',
        ativo: true
    });

    const [especialidades, setEspecialidades] = useState<Array<{ id: number; nome: string }>>([]);

    // ... hooks ...
    useEffect(() => {
        loadPrestadores();
        loadEspecialidades();
    }, []);

    // ... load functions ...
    const loadEspecialidades = async () => {
        try {
            const response = await especialidadesApi.getAll();
            if (response.success) {
                setEspecialidades(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar especialidades:', error);
        }
    };

    const loadPrestadores = async () => {
        try {
            setLoading(true);
            const response = await prestadoresApi.getAll();
            if (response.success) {
                setPrestadores(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar prestadores:', error);
        } finally {
            setLoading(false);
        }
    };

    // ... handlers ...
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar campos obrigatórios
        if (!formData.nome.trim()) {
            alert('❌ Por favor, preencha o Nome Completo');
            return;
        }

        if (!formData.especialidade.trim()) {
            alert('❌ Por favor, selecione a Especialidade');
            return;
        }

        if (!formData.telefone.trim()) {
            alert('❌ Por favor, preencha o Telefone');
            return;
        }

        const telefoneLimpo = removeMask(formData.telefone);

        if (formData.tipoPessoa === 'PF') {
            if (!formData.cpf.trim()) {
                alert('❌ Por favor, preencha o CPF');
                return;
            }
            const cpfLimpo = removeMask(formData.cpf);
            if (cpfLimpo.length !== 11) {
                alert('❌ CPF inválido. Deve conter 11 dígitos');
                return;
            }
        } else {
            if (!formData.cnpj.trim()) {
                alert('❌ Por favor, preencha o CNPJ');
                return;
            }
            const cnpjLimpo = removeMask(formData.cnpj);
            if (cnpjLimpo.length !== 14) {
                alert('❌ CNPJ inválido. Deve conter 14 dígitos');
                return;
            }
        }

        try {
            const dataToSend: any = {
                nome: formData.nome,
                especialidade: formData.especialidade,
                telefone: telefoneLimpo,
                email: formData.email,
                tipoPessoa: formData.tipoPessoa,
                cpf: formData.tipoPessoa === 'PF' ? removeMask(formData.cpf) : null,
                cnpj: formData.tipoPessoa === 'PJ' ? removeMask(formData.cnpj) : null,
                pixTipo: formData.pixTipo,
                pixChave: formData.pixChave,
                ativo: formData.ativo
            };

            if (editingPrestador) {
                const response = await prestadoresApi.update(editingPrestador.id, dataToSend);
                if (!response.success) {
                    throw new Error(response.error || 'Erro ao atualizar prestador');
                }
            } else {
                const response = await prestadoresApi.create(dataToSend);
                if (!response.success) {
                    throw new Error(response.error || 'Erro ao criar prestador');
                }
            }

            await loadPrestadores();
            handleCloseModal();
            alert('✅ Prestador salvo com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar prestador:', error);
            alert(`❌ Erro ao salvar prestador: ${error.message || 'Tente novamente'}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este prestador?')) return;

        try {
            await prestadoresApi.delete(id);
            await loadPrestadores();
        } catch (error) {
            console.error('Erro ao excluir prestador:', error);
        }
    };

    const handleEdit = (prestador: any) => {
        setEditingPrestador(prestador);
        setFormData({
            nome: prestador.nome,
            especialidade: prestador.especialidade,
            telefone: prestador.telefone ? maskPhone(prestador.telefone) : '',
            email: prestador.email || '',
            tipoPessoa: prestador.tipoPessoa || 'PF',
            cpf: prestador.cpf ? maskCPF(prestador.cpf) : '',
            cnpj: prestador.cnpj ? maskCNPJ(prestador.cnpj) : '',
            pixTipo: prestador.pixTipo || '',
            pixChave: prestador.pixChave || '',
            ativo: prestador.ativo
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPrestador(null);
        setFormData({
            nome: '',
            especialidade: '',
            telefone: '',
            email: '',
            tipoPessoa: 'PF',
            cpf: '',
            cnpj: '',
            pixTipo: '',
            pixChave: '',
            ativo: true
        });
    };

    const formatCPF = (cpf: string) => {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const formatPhone = (phone: string) => {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };

    const filteredPrestadores = prestadores.filter(prestador =>
        prestador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestador.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestador.cpf?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getEspecialidadeColor = (especialidade: string) => {
        const colors: { [key: string]: string } = {
            'Pedreiro': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            'Eletricista': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'Encanador': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            'Pintor': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            'Carpinteiro': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            'Mestre de Obras': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        return colors[especialidade] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">Prestadores de Serviço</h1>
                <p className="text-muted-foreground">Gerencie os prestadores de serviço cadastrados</p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar prestadores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                {canPerformAction('prestadores', 'criar', user) && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Novo Prestador
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Stats cards remain unchanged */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <UserCheck className="text-green-500" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{prestadores.filter(p => p.ativo).length}</p>
                            <p className="text-sm text-muted-foreground">Ativos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-500/10 rounded-lg">
                            <UserX className="text-gray-500" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{prestadores.filter(p => !p.ativo).length}</p>
                            <p className="text-sm text-muted-foreground">Inativos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Briefcase className="text-primary" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{prestadores.length}</p>
                            <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            )}

            {/* Prestadores Table */}
            {!loading && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-accent/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Especialidade
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Contato
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        CPF
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    {(canPerformAction('prestadores', 'editar', user) || canPerformAction('prestadores', 'excluir', user)) && (
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Ações
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredPrestadores.map((prestador) => (
                                    <tr key={prestador.id} className="hover:bg-accent/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Briefcase className="text-primary" size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{prestador.nome}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEspecialidadeColor(prestador.especialidade)}`}>
                                                {prestador.especialidade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {prestador.telefone && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone size={14} />
                                                        <span>{formatPhone(prestador.telefone)}</span>
                                                    </div>
                                                )}
                                                {prestador.email && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Mail size={14} />
                                                        <span className="truncate max-w-[200px]">{prestador.email}</span>
                                                    </div>
                                                )}
                                                {prestador.pixChave && (
                                                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                                        <Wallet size={14} />
                                                        <span className="truncate max-w-[200px]" title={prestador.pixChave}>
                                                            PIX: {prestador.pixTipo?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {prestador.cpf && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileText size={14} />
                                                    <span>{formatCPF(prestador.cpf)}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${prestador.ativo ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                <span className="text-sm text-muted-foreground">
                                                    {prestador.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </div>
                                        </td>
                                        {(canPerformAction('prestadores', 'editar', user) || canPerformAction('prestadores', 'excluir', user)) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canPerformAction('prestadores', 'editar', user) && (
                                                        <button
                                                            onClick={() => handleEdit(prestador)}
                                                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    {canPerformAction('prestadores', 'excluir', user) && (
                                                        <button
                                                            onClick={() => handleDelete(prestador.id)}
                                                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {filteredPrestadores.length === 0 && (
                        <div className="text-center py-12">
                            <Briefcase className="mx-auto text-muted-foreground mb-4" size={48} />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {searchTerm ? 'Nenhum prestador encontrado' : 'Nenhum prestador cadastrado'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm
                                    ? 'Tente buscar com outros termos'
                                    : 'Comece cadastrando seu primeiro prestador de serviço'}
                            </p>
                            {!searchTerm && canPerformAction('prestadores', 'criar', user) && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Novo Prestador
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-medium text-foreground">
                                {editingPrestador ? 'Editar Prestador' : 'Novo Prestador'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                                        placeholder="Ex: João Silva"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Tipo de Pessoa *</label>
                                    <div className="flex gap-4 p-1.5 bg-accent/30 rounded-lg border border-border">
                                        <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center py-1 rounded-md transition-colors hover:bg-accent/50">
                                            <input
                                                type="radio"
                                                name="tipoPessoa"
                                                value="PF"
                                                checked={formData.tipoPessoa === 'PF'}
                                                onChange={(e) => setFormData({ ...formData, tipoPessoa: e.target.value })}
                                                className="w-3.5 h-3.5 text-primary focus:ring-0"
                                            />
                                            <span className="text-xs">Física</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center py-1 rounded-md transition-colors hover:bg-accent/50">
                                            <input
                                                type="radio"
                                                name="tipoPessoa"
                                                value="PJ"
                                                checked={formData.tipoPessoa === 'PJ'}
                                                onChange={(e) => setFormData({ ...formData, tipoPessoa: e.target.value })}
                                                className="w-3.5 h-3.5 text-primary focus:ring-0"
                                            />
                                            <span className="text-xs">Jurídica</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Especialidade *</label>
                                <select
                                    value={formData.especialidade}
                                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {especialidades.map(esp => (
                                        <option key={esp.id} value={esp.nome}>{esp.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Telefone *</label>
                                    <input
                                        type="tel"
                                        value={formData.telefone}
                                        onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                                        placeholder="(11) 98765-4321"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {formData.tipoPessoa === 'PF' ? 'CPF *' : 'CNPJ *'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tipoPessoa === 'PF' ? formData.cpf : formData.cnpj}
                                        onChange={(e) => {
                                            if (formData.tipoPessoa === 'PF') {
                                                setFormData({ ...formData, cpf: maskCPF(e.target.value) });
                                            } else {
                                                setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) });
                                            }
                                        }}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                                        placeholder={formData.tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                    placeholder="joao@example.com"
                                />
                            </div>

                            {/* Campos PIX */}
                            <div className="border-t border-border pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Dados PIX (Opcional)</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Tipo de Chave PIX</label>
                                        <select
                                            value={formData.pixTipo}
                                            onChange={(e) => setFormData({ ...formData, pixTipo: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="cpf">CPF</option>
                                            <option value="cnpj">CNPJ</option>
                                            <option value="telefone">Telefone</option>
                                            <option value="email">E-mail</option>
                                            <option value="chave_aleatoria">Chave Aleatória</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Chave PIX</label>
                                        <input
                                            type="text"
                                            value={formData.pixChave}
                                            onChange={(e) => setFormData({ ...formData, pixChave: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                            placeholder={
                                                formData.pixTipo === 'cpf' ? '000.000.000-00' :
                                                    formData.pixTipo === 'cnpj' ? '00.000.000/0000-00' :
                                                        formData.pixTipo === 'telefone' ? '(11) 98765-4321' :
                                                            formData.pixTipo === 'email' ? 'email@example.com' :
                                                                formData.pixTipo === 'chave_aleatoria' ? 'Chave aleatória' :
                                                                    'Digite a chave PIX'
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="ativo"
                                    checked={formData.ativo}
                                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                    className="w-4 h-4 rounded border-input"
                                />
                                <label htmlFor="ativo" className="text-sm font-medium">
                                    Prestador ativo
                                </label>
                            </div>

                            <div className="flex gap-4 pt-6 sticky bottom-0 bg-background border-t border-border mt-4 z-10">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        editingPrestador ? 'Salvar Alterações' : 'Cadastrar Prestador'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
