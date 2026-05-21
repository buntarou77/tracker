'use client'
import { createPortal } from 'react-dom';
import { useUI } from '../context/UIContext';
import EditBankModal from './modalComponents/editBankModal'
import SettingsAccountModal from './modalComponents/settingAccountModal'
import TransactionModal from '@/app/components/modalComponents/showtransactionsModal'
import AddTransactionModal from './modalComponents/addTransaction';
import { useEffect } from 'react';
export default function ModalRoot() {
  console.log('modalRoot')
  const { modal, setModal } = useUI(); 
  console.log('modalRoot', modal)
  useEffect(()=>{
    console.log('root modal effect')
    if(modal.type !== '') document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  }, [modal])
  if (modal?.type === '' || !modal) return null;
  const close = () => {
    setModal({type: '', payload: null})
    document.body.style.overflow = 'auto';
  };
    type propEditModalType = {
        name: string;
        currency: string;
        balance: number;
        notes: string;
        createdAt: string;
    }
  
  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 p-6 rounded-xl relative">
        <button onClick={close} className="absolute top-2 right-2">✕</button>

        {modal.type === 'editBank' && (
          <EditBankModal {...modal.payload as propEditModalType} onClose={close}/>
        )}
        {modal.type === 'settings' && (
          <SettingsAccountModal {...modal.payload} onClose={close}/>
        )}
        {modal.type === 'transactionsData' && (
          <TransactionModal {...modal.payload} onClose={close}/>
        )}
        {modal.type === 'addTransaction' && (
          <AddTransactionModal {...modal.payload} onClose={close}></AddTransactionModal>
        )}
      </div>
    </div>,
    document.body
  );
}