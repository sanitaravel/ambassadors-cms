export interface FormActionsProps {
  isLoading: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function FormActions({ isLoading, submitLabel = 'Save', onCancel }: FormActionsProps) {
  return (
    <div style={styles.wrapper}>
      <button
        type="submit"
        disabled={isLoading}
        style={{
          ...styles.submitButton,
          ...(isLoading ? styles.submitButtonDisabled : {}),
        }}
      >
        {isLoading && <span style={styles.spinner} aria-hidden="true" />}
        {isLoading ? 'Saving...' : submitLabel}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={styles.cancelButton}
          disabled={isLoading}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '24px',
  },
  submitButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '44px',
    minWidth: '44px',
    padding: '10px 24px',
    backgroundColor: '#d54407',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  cancelButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
};
