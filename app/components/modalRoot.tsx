'use client'
import { createPortal } from 'react-dom';
import { useUI } from '../context/UIContext';
import EditBankModal from './modalComponents/editBankModal'
import SettingsAccountModal from './modalComponents/settingAccountModal'
import TransactionModal from '@/app/components/modalComponents/showtransactionsModal'
import { useEffect } from 'react';
export default function ModalRoot() {
  const { modal, setModal } = useUI();
  console.log(modal)
  if (modal?.type === '' || !modal) return null;
  useEffect(()=>{
    console.log('root modal effect')
    if(modal.type !== '') document.body.style.overflow = 'hidden';
  }, [modal])
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
      </div>
    </div>,
    document.body
  );
}