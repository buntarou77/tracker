'use client'
import { createPortal } from 'react-dom';
import { useUI } from '../context/UIContext';
import EditBankModal from './../components/editBankModal'
import SettingsAccountModal from '../components/settingAccountModal'
export default function ModalRoot() {
  const { modal, setModal } = useUI();
  console.log(modal)
  if (modal.type === '' || !modal) return null;

  const close = () => setModal({type: '', payload: null});
    type propEditModalType = {
        name: string;
        currency: string;
        balance: number;
        notes: string;
        createdAt: string;
    }
  console.log(modal.type)
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
      </div>
    </div>,
    document.body
  );
}