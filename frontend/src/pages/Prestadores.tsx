import { useState, useEffect } from 'react';
import type { Prestador } from '../types';
import { prestadoresApi, especialidadesApi } from '../lib/api';
import { maskCPF, maskCNPJ, maskPhone, removeMask, maskCurrency } from '../lib/masks';
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
    PiSpinner as Loader2,
    PiX as X,
    PiWallet as Wallet,
    PiMoney as Money,
    PiIdentificationCard as IDCard,
    PiBank as Bank,
    PiDotsThreeVertical as MoreVertical
} from 'react-icons/pi';
import { cn } from '../utils/cn';

// Helper de formatação de moeda
const formatCurrency = (value: number | string | undefined) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
};

export function Prestadores() {
    const { user } = useAuthStore();
    const [prestadores, setPrestadores] = useState<Prestador[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false); // Novo estado
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPrestador, setEditingPrestador] = useState<Prestador | null>(null);
    const [especialidades, setEspecialidades] = useState<Array<{ id: number; nome: string }>>([]);

    // Tab state
    const [activeTab, setActiveTab] = useState<'geral' | 'pagamento' | 'contratacao'>('geral');

    const [formData, setFormData] = useState({
        nome: '',
        especialidade: '',
        telefone: '',
        email: '',
        tipoPessoa: 'PF',
        cpf: '',
        cnpj: '',
        ativo: true,
        // Novos campos
        pixTipo: '',
        pixChave: '',
        tipoContrato: 'diaria', // diaria, empreita, clt
        valorDiaria: '',
        valorValeRefeicao: '',
        valorValeTransporte: '',
        salario: '',
        bonificacao: '',
        diaPagamento: '5',
        diaVale: '20',
        valorAdiantamento: '',
        usaFolhaPonto: true // Novo campo
    });

    useEffect(() => {
        loadPrestadores();
        loadEspecialidades();
    }, []);

    const loadEspecialidades = async () => {
        try {
            const response = await especialidadesApi.getAll();
            if (response.success) setEspecialidades(response.data);
        } catch (error) {
            console.error('Erro ao carregar especialidades:', error);
        }
    };

    const loadPrestadores = async () => {
        try {
            setLoading(true);
            const response = await prestadoresApi.getAll();
            if (response.success) setPrestadores(response.data);
        } catch (error) {
            console.error('Erro ao carregar prestadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true); // Bloqueia

        // Validações básicas
        if (!formData.nome.trim()) return alert('❌ Preencha o Nome Completo');
        if (!formData.especialidade.trim()) return alert('❌ Selecione a Especialidade');
        if (!formData.telefone.trim()) return alert('❌ Preencha o Telefone');

        const telefoneLimpo = removeMask(formData.telefone);

        if (formData.tipoPessoa === 'PF') {
            if (!formData.cpf.trim()) return alert('❌ Preencha o CPF');
            if (removeMask(formData.cpf).length !== 11) return alert('❌ CPF inválido (11 dígitos)');
        } else {
            if (!formData.cnpj.trim()) return alert('❌ Preencha o CNPJ');
            if (removeMask(formData.cnpj).length !== 14) return alert('❌ CNPJ inválido (14 dígitos)');
        }

        try {
            const parseMoney = (val: string) => val ? parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.')) : null;

            const dataToSend: any = {
                nome: formData.nome,
                especialidade: formData.especialidade,
                telefone: telefoneLimpo,
                email: formData.email,
                tipoPessoa: formData.tipoPessoa,
                cpf: formData.tipoPessoa === 'PF' ? removeMask(formData.cpf) : null,
                cnpj: formData.tipoPessoa === 'PJ' ? removeMask(formData.cnpj) : null,
                ativo: formData.ativo,
                pixTipo: formData.pixTipo || null,
                pixChave: formData.pixChave || null,
                tipoContrato: formData.tipoContrato,
                valorDiaria: parseMoney(formData.valorDiaria),
                valorValeRefeicao: parseMoney(formData.valorValeRefeicao),
                valorValeTransporte: parseMoney(formData.valorValeTransporte),
                salario: parseMoney(formData.salario),
                bonificacao: parseMoney(formData.bonificacao),
                diaPagamento: parseInt(formData.diaPagamento) || 5,
                diaVale: parseInt(formData.diaVale) || 20,
                valorAdiantamento: parseMoney(formData.valorAdiantamento),
                usaFolhaPonto: formData.usaFolhaPonto // Envia para API
            };

            if (editingPrestador) {
                const response = await prestadoresApi.update(editingPrestador.id, dataToSend);
                if (!response.success) throw new Error(response.error || 'Erro ao atualizar');
            } else {
                const response = await prestadoresApi.create(dataToSend);
                if (!response.success) throw new Error(response.error || 'Erro ao criar');
            }

            await loadPrestadores();
            handleCloseModal();
            alert('✅ Prestador salvo com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert(`❌ Erro ao salvar: ${error.message}`);
        } finally {
            setProcessing(false); // Libera
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este prestador?')) return;
        try {
            await prestadoresApi.delete(id);
            await loadPrestadores();
        } catch (error) {
            console.error('Erro ao excluir:', error);
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
            ativo: prestador.ativo,
            pixTipo: prestador.pixTipo || '',
            pixChave: prestador.pixChave || '',
            tipoContrato: prestador.tipoContrato || 'diaria',
            valorDiaria: prestador.valorDiaria ? maskCurrency(prestador.valorDiaria.toString()) : '',
            valorValeRefeicao: prestador.valorValeRefeicao ? maskCurrency(prestador.valorValeRefeicao.toString()) : '',
            valorValeTransporte: prestador.valorValeTransporte ? maskCurrency(prestador.valorValeTransporte.toString()) : '',
            salario: prestador.salario ? maskCurrency(prestador.salario.toString()) : '',
            bonificacao: prestador.bonificacao ? maskCurrency(prestador.bonificacao.toString()) : '',
            diaPagamento: prestador.diaPagamento ? prestador.diaPagamento.toString() : '5',
            diaVale: prestador.diaVale ? prestador.diaVale.toString() : '20',
            valorAdiantamento: prestador.valorAdiantamento ? maskCurrency(prestador.valorAdiantamento.toString()) : '',
            usaFolhaPonto: prestador.usaFolhaPonto !== undefined ? prestador.usaFolhaPonto : true,
        });
        setActiveTab('geral');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPrestador(null);
        setActiveTab('geral');
        setFormData({
            nome: '', especialidade: '', telefone: '', email: '', tipoPessoa: 'PF', cpf: '', cnpj: '', ativo: true,
            pixTipo: '', pixChave: '', tipoContrato: 'diaria', valorDiaria: '', valorValeRefeicao: '', valorValeTransporte: '', salario: '', bonificacao: '',
            diaPagamento: '5', diaVale: '20', valorAdiantamento: '', usaFolhaPonto: true
        });
    };

    const handleMoneyInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        let value = e.target.value;
        setFormData({ ...formData, [field]: maskCurrency(value) });
    };

    const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    const formatPhone = (phone: string) => phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');

    const filteredPrestadores = prestadores.filter(prestador =>
        prestador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestador.especialidade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getEspecialidadeColor = (especialidade: string) => {
        const colors: any = {
            'Pedreiro': 'bg-orange-100 text-orange-800',
            'Eletricista': 'bg-yellow-100 text-yellow-800',
            'Encanador': 'bg-blue-100 text-blue-800',
            'Pintor': 'bg-purple-100 text-purple-800',
            'Mestre de Obras': 'bg-red-100 text-red-800',
        };
        return colors[especialidade] || 'bg-gray-100 text-gray-800';
    };

    const getContratoBadge = (tipo: string | undefined) => {
        if (!tipo) return <span className="text-gray-400">-</span>;
        const styles: any = {
            'diaria': 'bg-blue-50 text-blue-700 border-blue-100',
            'empreita': 'bg-amber-50 text-amber-700 border-amber-100',
            'clt': 'bg-green-50 text-green-700 border-green-100'
        };
        return (
            <span className={cn("px-2.5 py-0.5 rounded-md text-xs font-medium border capitalize", styles[tipo] || styles['diaria'])}>
                {tipo}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Prestadores</h1>
                    <p className="text-muted-foreground">Gerencie sua equipe, pagamentos e contratos</p>
                </div>
                {canPerformAction('prestadores', 'criar', user) && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 font-medium"
                    >
                        <Plus size={20} /> Novo Prestador
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome, especialidade ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                />
            </div>

            {/* Loading / Empty / Table */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
            ) : filteredPrestadores.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Briefcase className="mx-auto text-gray-300 mb-4" size={50} />
                    <p className="text-gray-500 font-medium">Nenhum prestador encontrado.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prestador</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Especialidade</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contrato</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPrestadores.map((prestador) => (
                                    <tr key={prestador.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {prestador.nome.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{prestador.nome}</p>
                                                    <p className="text-xs text-gray-500">{prestador.email || 'Sem email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getEspecialidadeColor(prestador.especialidade))}>
                                                {prestador.especialidade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                {prestador.telefone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <span>{formatPhone(prestador.telefone)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {getContratoBadge(prestador.tipoContrato)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={cn(
                                                "inline-flex w-2.5 h-2.5 rounded-full",
                                                prestador.ativo ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-300"
                                            )} title={prestador.ativo ? 'Ativo' : 'Inativo'} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canPerformAction('prestadores', 'editar', user) && (
                                                    <button onClick={() => handleEdit(prestador)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Editar">
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {canPerformAction('prestadores', 'excluir', user) && (
                                                    <button onClick={() => handleDelete(prestador.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Cadastro/Edição com ABAS */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">{editingPrestador ? 'Editar Prestador' : 'Novo Prestador'}</h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex border-b border-gray-100 px-6">
                            <button
                                onClick={() => setActiveTab('geral')}
                                className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'geral' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                            >
                                <Briefcase size={18} /> Dados Gerais
                            </button>
                            <button
                                onClick={() => setActiveTab('pagamento')}
                                className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'pagamento' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                            >
                                <Bank size={18} /> Pagamento (Pix)
                            </button>
                            <button
                                onClick={() => setActiveTab('contratacao')}
                                className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'contratacao' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                            >
                                <IDCard size={18} /> Contratação
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            {/* ABA 1: DADOS GERAIS */}
                            {activeTab === 'geral' && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome Completo *</label>
                                            <input type="text" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" placeholder="Ex: João da Silva" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Especialidade *</label>
                                            <select required value={formData.especialidade} onChange={e => setFormData({ ...formData, especialidade: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none bg-white">
                                                <option value="">Selecione...</option>
                                                {especialidades.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone *</label>
                                            <input type="tel" required value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none" placeholder="(00) 00000-0000" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo Pessoa</label>
                                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                                <button type="button" onClick={() => setFormData({ ...formData, tipoPessoa: 'PF' })} className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-all", formData.tipoPessoa === 'PF' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>Física</button>
                                                <button type="button" onClick={() => setFormData({ ...formData, tipoPessoa: 'PJ' })} className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-all", formData.tipoPessoa === 'PJ' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>Jurídica</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{formData.tipoPessoa === 'PF' ? 'CPF *' : 'CNPJ *'}</label>
                                            <input type="text" required value={formData.tipoPessoa === 'PF' ? formData.cpf : formData.cnpj} onChange={e => setFormData({ ...formData, [formData.tipoPessoa === 'PF' ? 'cpf' : 'cnpj']: formData.tipoPessoa === 'PF' ? maskCPF(e.target.value) : maskCNPJ(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none" placeholder={formData.tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none" placeholder="email@exemplo.com" />
                                        </div>
                                        <div className="md:col-span-2 flex items-center gap-3 pt-2">
                                            <input type="checkbox" id="ativo" checked={formData.ativo} onChange={e => setFormData({ ...formData, ativo: e.target.checked })} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-600" />
                                            <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Prestador Ativo no Sistema</label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ABA 2: PAGAMENTO (PIX) */}
                            {activeTab === 'pagamento' && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-700 text-sm mb-4">
                                        <Wallet size={20} className="shrink-0" />
                                        <p>Informe os dados bancários para facilitar os pagamentos via PIX.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Chave Pix</label>
                                            <select value={formData.pixTipo} onChange={e => setFormData({ ...formData, pixTipo: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none bg-white">
                                                <option value="">Selecione...</option>
                                                <option value="cpf">CPF</option>
                                                <option value="cnpj">CNPJ</option>
                                                <option value="telefone">Telefone</option>
                                                <option value="email">E-mail</option>
                                                <option value="chave_aleatoria">Chave Aleatória</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chave Pix</label>
                                            <input type="text" value={formData.pixChave} onChange={e => setFormData({ ...formData, pixChave: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none" placeholder="Digite a chave pix" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ABA 3: CONTRATAÇÃO */}
                            {activeTab === 'contratacao' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

                                    {/* Seleção do Tipo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Modalidade de Contratação</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { id: 'diaria', label: 'Diária', desc: 'Valor por dia + Benefícios' },
                                                { id: 'empreita', label: 'Empreita', desc: 'Valor fechado por obra/etapa' },
                                                { id: 'clt', label: 'CLT', desc: 'Salário Fixo + Benefícios' }
                                            ].map((tipo) => (
                                                <button
                                                    key={tipo.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, tipoContrato: tipo.id })}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                                                        formData.tipoContrato === tipo.id
                                                            ? "border-blue-600 bg-blue-50 shadow-sm"
                                                            : "border-gray-100 hover:border-gray-200 bg-white"
                                                    )}
                                                >
                                                    <div className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                                                        {tipo.label}
                                                        {formData.tipoContrato === tipo.id && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{tipo.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Campos Condicionais */}
                                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-4">
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <Money className="text-blue-600" /> Valores Financeiros
                                        </h3>

                                        {formData.tipoContrato === 'diaria' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Valor da Diária (R$)</label>
                                                    <input type="text" value={formData.valorDiaria} onChange={e => handleMoneyInput(e, 'valorDiaria')} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="R$ 0,00" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Vale Refeição / Alimentação (R$)</label>
                                                    <input type="text" value={formData.valorValeRefeicao} onChange={e => handleMoneyInput(e, 'valorValeRefeicao')} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="R$ 0,00" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Vale Transporte (R$)</label>
                                                    <input type="text" value={formData.valorValeTransporte} onChange={e => handleMoneyInput(e, 'valorValeTransporte')} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="R$ 0,00" />
                                                </div>
                                            </div>
                                        )}

                                        {formData.tipoContrato === 'empreita' && (
                                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100 animate-in fade-in">
                                                <p><strong>Nota:</strong> Para empreita, os valores são definidos por <strong>Atribuição/Tarefa</strong> ou Medição no decorrer da obra. Não há valor fixo mensal pré-definido aqui.</p>
                                            </div>
                                        )}

                                        {formData.tipoContrato === 'clt' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Salário Base (R$)</label>
                                                    <input type="text" value={formData.salario} onChange={e => handleMoneyInput(e, 'salario')} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none font-semibold text-lg" placeholder="R$ 0,00" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Vale Refeição (R$)</label>
                                                    <input type="text" value={formData.valorValeRefeicao} onChange={e => handleMoneyInput(e, 'valorValeRefeicao')} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="R$ 0,00" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Vale Transporte (R$)</label>
                                                    <input type="text" value={formData.valorValeTransporte} onChange={e => handleMoneyInput(e, 'valorValeTransporte')} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="R$ 0,00" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bonificação Mensal (R$)</label>
                                                    <input type="text" value={formData.bonificacao} onChange={e => handleMoneyInput(e, 'bonificacao')} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="R$ 0,00" />
                                                </div>

                                                <div className="md:col-span-2 border-t pt-4 mt-2">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Configuração de Pagamento (Datas)</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Dia do Salário</label>
                                                            <input type="number" min="1" max="31" value={formData.diaPagamento} onChange={e => setFormData({ ...formData, diaPagamento: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="Ex: 5" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Dia do Vale/Adiantamento</label>
                                                            <input type="number" min="1" max="31" value={formData.diaVale} onChange={e => setFormData({ ...formData, diaVale: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="Ex: 20" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Valor do Vale (R$)</label>
                                                            <input type="text" value={formData.valorAdiantamento} onChange={e => handleMoneyInput(e, 'valorAdiantamento')} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-600 outline-none" placeholder="R$ 0,00" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 border-t pt-4 mt-2">
                                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                                                        <input
                                                            type="checkbox"
                                                            id="usaFolhaPonto"
                                                            checked={formData.usaFolhaPonto}
                                                            onChange={e => setFormData({ ...formData, usaFolhaPonto: e.target.checked })}
                                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-600 cursor-pointer"
                                                        />
                                                        <div>
                                                            <label htmlFor="usaFolhaPonto" className="text-sm font-medium text-gray-900 cursor-pointer">Ativar Folha de Ponto</label>
                                                            <p className="text-xs text-gray-500">Se desmarcado, este prestador não aparecerá na lista de frequência diária.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </form>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                            <button onClick={handleCloseModal} disabled={processing} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors border border-transparent disabled:opacity-50">Cancelar</button>
                            <button onClick={handleSubmit} disabled={processing} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                {processing ? 'Salvando...' : (editingPrestador ? 'Salvar Tudo' : 'Cadastrar Prestador')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
