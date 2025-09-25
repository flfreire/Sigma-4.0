
import React, { useState, useMemo, useEffect } from 'react';
import { Quote, Partner, User, QuoteStatus, QuoteType, QuoteItem, ProjectFile } from '../types';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';
import { PlusIcon, CurrencyDollarIcon, TrashIcon, DocumentIcon, EyeIcon, XMarkIcon } from './icons';
import { generateQuoteEmailBody } from '../services/geminiService';

interface QuoteListProps {
  quotes: Quote[];
  partners: Partner[];
  currentUser: User;
  addQuote: (item: Omit<Quote, 'id'>) => Promise<void>;
  updateQuote: (item: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
}

const statusColorMap: { [key in QuoteStatus]: string } = {
  [QuoteStatus.Draft]: 'bg-gray-500',
  [QuoteStatus.Sent]: 'bg-blue-500',
  [QuoteStatus.Answered]: 'bg-yellow-500',
  [QuoteStatus.Approved]: 'bg-green-500',
  [QuoteStatus.Rejected]: 'bg-red-500',
};

// ... (QuoteForm component will be defined below)

const QuoteList: React.FC<QuoteListProps> = ({ quotes, partners, currentUser, addQuote, updateQuote, deleteQuote }) => {
    const { t, language } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

    const getPartnerName = (partnerId: string) => partners.find(p => p.id === partnerId)?.name || partnerId;

    const handleOpenModal = (quote?: Quote) => {
        setEditingQuote(quote || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingQuote(null);
    };

    const handleSave = async (data: any) => {
        if (editingQuote) {
            await updateQuote({ ...editingQuote, ...data });
        } else {
            await addQuote({ ...data, requesterUserId: currentUser.id });
        }
        handleCloseModal();
    };

    const handleDelete = (quote: Quote) => {
        if (window.confirm(t('quotes.deleteConfirm', { title: quote.title }))) {
            deleteQuote(quote.id);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-light flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 mr-3 text-brand" />
                    {t('quotes.title')}
                </h2>
                <button onClick={() => handleOpenModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t('quotes.add')}
                </button>
            </div>

            <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-x-auto">
                <table className="min-w-full divide-y divide-accent">
                    <thead className="bg-primary">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('quotes.headers.id')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('quotes.headers.title')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('quotes.headers.partner')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('quotes.headers.status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('quotes.headers.requestDate')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('quotes.headers.totalCost')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('quotes.headers.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-secondary divide-y divide-accent">
                        {quotes.map(quote => (
                            <tr key={quote.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-light font-mono">{quote.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-light font-semibold">{quote.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{getPartnerName(quote.partnerId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColorMap[quote.status]}`}>
                                        {t(`enums.quoteStatus.${quote.status}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{new Date(quote.requestDate).toLocaleDateString(language)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{quote.totalCost?.toLocaleString(language, { style: 'currency', currency: 'BRL' }) || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                    <button onClick={() => handleOpenModal(quote)} className="text-brand hover:text-blue-400">{t('quotes.details')}</button>
                                    <button onClick={() => handleDelete(quote)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-4 w-4 inline"/></button>
                                </td>
                            </tr>
                        ))}
                         {quotes.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-highlight">
                                    {t('quotes.noQuotes')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <QuoteFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSave}
                initialData={editingQuote}
                partners={partners}
                currentUser={currentUser}
            />
        </div>
    );
};

interface QuoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData: Quote | null;
    partners: Partner[];
    currentUser: User;
}

const QuoteFormModal: React.FC<QuoteFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, partners, currentUser }) => {
    const { t, language } = useTranslation();
    const isEditMode = !!initialData;
    const [formData, setFormData] = useState<any>({});
    const [isSending, setIsSending] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            const data = initialData ? { ...initialData } : {
                partnerId: '',
                quoteType: QuoteType.Parts,
                status: QuoteStatus.Draft,
                title: '',
                description: '',
                requestDate: new Date().toISOString(),
                items: [{ id: `item-${Date.now()}`, description: '', quantity: 1 }],
                attachments: [],
                notes: '',
                totalCost: 0,
            };
            setFormData(data);
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumber = ['totalCost', 'unitPrice', 'quantity'].includes(name);
        setFormData((prev: any) => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
        const newItems = [...formData.items];
        const item = { ...newItems[index], [field]: value };

        if(field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? Number(value) : item.quantity;
            const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
            if(typeof qty === 'number' && typeof price === 'number') {
                item.totalPrice = qty * price;
            }
        }

        newItems[index] = item;
        
        const totalCost = newItems.reduce((sum, current) => sum + (current.totalPrice || 0), 0);
        setFormData((prev: any) => ({ ...prev, items: newItems, totalCost }));
    };

    const handleAddItem = () => {
        const newItem: QuoteItem = { id: `item-${Date.now()}`, description: '', quantity: 1 };
        setFormData((prev: any) => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const handleRemoveItem = (id: string) => {
        const newItems = formData.items.filter((item: QuoteItem) => item.id !== id);
        const totalCost = newItems.reduce((sum, current) => sum + (current.totalPrice || 0), 0);
        setFormData((prev: any) => ({ ...prev, items: newItems, totalCost }));
    };
    
    const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) { alert(t('quotes.form.fileSizeError')); return; }

        const reader = new FileReader();
        reader.onloadend = () => {
            const newFile: ProjectFile = {
                id: `file-${Date.now()}`,
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : 'pdf',
                data: reader.result as string
            };
            setFormData((prev: any) => ({ ...prev, attachments: [...(prev.attachments || []), newFile] }));
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };
    
    const handleFileDelete = (id: string) => {
        setFormData((prev: any) => ({ ...prev, attachments: prev.attachments.filter((f: ProjectFile) => f.id !== id)}));
    };

    const handleSubmit = async (e: React.FormEvent, newStatus?: QuoteStatus) => {
        e.preventDefault();
        let dataToSubmit = { ...formData };
        if (newStatus) {
            dataToSubmit.status = newStatus;
        }

        if (newStatus === QuoteStatus.Sent) {
            const selectedPartner = partners.find(p => p.id === dataToSubmit.partnerId);
            if (!selectedPartner || !selectedPartner.email) {
                alert("Selected partner does not have a valid email address.");
                return;
            }
            setIsSending(true);
            try {
                const emailBody = await generateQuoteEmailBody(dataToSubmit, selectedPartner, currentUser, language as 'pt' | 'en');
                const mailtoLink = `mailto:${selectedPartner.email}?subject=${encodeURIComponent(dataToSubmit.title)}&body=${encodeURIComponent(emailBody)}`;
                window.location.href = mailtoLink;
                // Give the mail client a moment to open before saving and closing the modal
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                alert(error instanceof Error ? error.message : "An unknown error occurred while generating the email.");
                setIsSending(false);
                return;
            } finally {
                setIsSending(false);
            }
        }

        await onSubmit(dataToSubmit);
    };

    if (!isOpen || Object.keys(formData).length === 0) return null;
    const canEditRequest = [QuoteStatus.Draft].includes(formData.status);
    const canEditResponse = [QuoteStatus.Answered, QuoteStatus.Approved, QuoteStatus.Rejected].includes(formData.status);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? t('quotes.modalEditTitle') : t('quotes.modalAddTitle')}>
            <form className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-highlight">{t('quotes.form.partner')}</label>
                        <select name="partnerId" value={formData.partnerId} onChange={handleChange} required disabled={!canEditRequest} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2 disabled:opacity-70">
                            <option value="">{t('quotes.form.selectPartner')}</option>
                            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-highlight">{t('quotes.form.status')}</label>
                        <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                            {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{t(`enums.quoteStatus.${s}`)}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('quotes.form.title')}</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required disabled={!canEditRequest} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2 disabled:opacity-70" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-highlight">{t('quotes.form.description')}</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} disabled={!canEditRequest} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2 disabled:opacity-70" />
                </div>
                
                {/* Items */}
                <div>
                    <h4 className="text-lg font-semibold text-light mb-2">{t('quotes.form.itemsTitle')}</h4>
                    <div className="space-y-3 p-3 bg-primary rounded-md border border-accent">
                        {formData.items.map((item: QuoteItem, index: number) => (
                            <div key={item.id} className="p-2 bg-secondary rounded-md grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-12 md:col-span-5">
                                    <label className="block text-xs font-medium text-highlight">{t('quotes.form.itemDescription')}</label>
                                    <input type="text" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required disabled={!canEditRequest} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2 text-sm disabled:opacity-70" />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-xs font-medium text-highlight">{t('quotes.form.itemQuantity')}</label>
                                    <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} required min="1" disabled={!canEditRequest} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2 text-sm disabled:opacity-70" />
                                </div>
                                 <div className="col-span-8 md:col-span-2">
                                    <label className="block text-xs font-medium text-highlight">{t('quotes.form.itemUnitPrice')}</label>
                                    <input type="number" value={item.unitPrice || ''} onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} min="0" step="0.01" disabled={!canEditResponse} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2 text-sm disabled:opacity-70" />
                                </div>
                                <div className="col-span-12 md:col-span-2">
                                     <label className="block text-xs font-medium text-highlight">Total</label>
                                     <p className="mt-1 block w-full bg-primary border-accent rounded-md p-2 text-sm text-light h-10 flex items-center">{item.totalPrice?.toLocaleString(language, {style:'currency', currency:'BRL'}) || '-'}</p>
                                </div>
                                <div className="col-span-12 md:col-span-1 flex justify-end">
                                    {canEditRequest && <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 p-2"><XMarkIcon className="h-5 w-5"/></button>}
                                </div>
                            </div>
                        ))}
                        {canEditRequest && <button type="button" onClick={handleAddItem} className="w-full mt-3 bg-accent text-light font-bold py-2 px-4 rounded-md hover:bg-highlight flex items-center justify-center"><PlusIcon className="h-5 w-5 mr-2"/>{t('quotes.form.addItem')}</button>}
                    </div>
                </div>

                {/* Response section */}
                 {canEditResponse && (
                    <div className="space-y-4 pt-4 border-t border-accent">
                         <div>
                            <label className="block text-sm font-medium text-highlight">{t('quotes.form.notes')}</label>
                            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-highlight">{t('quotes.form.totalCost')}</label>
                            <input type="number" name="totalCost" value={formData.totalCost || 0} onChange={handleChange} min="0" step="0.01" className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                        </div>
                    </div>
                )}
                
                {/* Attachments */}
                <div>
                     <h4 className="text-lg font-semibold text-light mb-2">{t('quotes.form.attachmentsTitle')}</h4>
                     <div className="p-3 bg-primary rounded-md border border-accent">
                         {canEditRequest && <label htmlFor="file-upload" className="mb-3 cursor-pointer bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight text-sm text-center transition-colors inline-block">{t('quotes.form.addAttachment')}</label>}
                         <input id="file-upload" type="file" onChange={handleFileAdd} className="hidden" accept="image/jpeg,image/png,application/pdf" />
                         {formData.attachments && formData.attachments.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {formData.attachments.map((file: ProjectFile) => (
                                    <div key={file.id} className="group relative bg-secondary rounded-md border border-accent p-2 text-center">
                                        <DocumentIcon className="h-10 w-10 text-brand mx-auto"/>
                                        <p className="text-xs text-highlight mt-1 truncate w-full">{file.name}</p>
                                        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                            <a href={file.data} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-500"><EyeIcon className="h-5 w-5" /></a>
                                            {canEditRequest && <button type="button" onClick={() => handleFileDelete(file.id)} className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-500"><TrashIcon className="h-5 w-5" /></button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-sm text-highlight">{t('equipment.drawings.noFiles')}</p>}
                     </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-accent">
                    <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('quotes.form.cancel')}</button>
                    {formData.status === QuoteStatus.Draft ? (
                        <>
                           <button type="button" onClick={(e) => handleSubmit(e)} className="bg-highlight text-light font-bold py-2 px-6 rounded-md hover:bg-opacity-80">{t('quotes.form.saveDraft')}</button>
                           <button type="button" onClick={(e) => handleSubmit(e, QuoteStatus.Sent)} disabled={isSending} className="bg-brand text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600 disabled:bg-gray-500 flex justify-center items-center">
                                {isSending ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : t('quotes.form.sendQuote')}
                           </button>
                        </>
                    ) : (
                        <button type="button" onClick={(e) => handleSubmit(e)} className="bg-brand text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600">{t('equipment.form.save')}</button>
                    )}
                </div>
            </form>
        </Modal>
    )
};

export default QuoteList;
