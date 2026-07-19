import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 rounded-full p-3 ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
          <AlertTriangle className={`h-6 w-6 ${danger ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
        <p className="text-sm text-gray-600 pt-2">{message}</p>
      </div>
    </Modal>
  );
}
