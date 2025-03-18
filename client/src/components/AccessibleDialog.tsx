import React, { useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogProps, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton 
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Interface personalizada que não estende DialogProps para evitar conflitos de tipo
interface AccessibleDialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  hideCloseButton?: boolean;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * Um componente de diálogo acessível que evita problemas com aria-hidden
 * e garante que o foco seja gerenciado corretamente.
 */
const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  children,
  title,
  onClose,
  actions,
  hideCloseButton = false,
  ...dialogProps
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Quando o diálogo é aberto, definir o foco no primeiro elemento focável
  useEffect(() => {
    if (dialogProps.open && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [dialogProps.open]);

  return (
    <Dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={title ? "accessible-dialog-title" : undefined}
      open={dialogProps.open}
      maxWidth={dialogProps.maxWidth}
      fullWidth={dialogProps.fullWidth}
      // Garantir que o diálogo seja acessível
      keepMounted={false}
      disablePortal={false}
      container={document.body}
    >
      {title && (
        <DialogTitle id="accessible-dialog-title">
          {title}
          {!hideCloseButton && (
            <IconButton
              aria-label="fechar"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      
      <DialogContent>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AccessibleDialog; 