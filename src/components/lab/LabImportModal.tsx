/**
 * Astro Blog「试验田 Lab」代码包导入确认对话框 (LabImportModal)
 *
 * 实施严格安全防线：
 * 1. 导入前向用户出示完整 Manifest、文件清单与体积统计；
 * 2. 标明代码来源为「外部导入 (imported)」与潜在安全风险；
 * 3. 明确提示「导入后绝不会自动运行，必须由用户手动点击运行」；
 * 4. 完整的无障碍属性 (role="dialog"、aria-modal="true"、Focus Trap、Escape 退出)。
 */
import React, { useEffect, useRef } from 'react';

export interface PendingImportBundle {
  manifest: {
    slug?: string;
    title?: string;
    description?: string;
    category?: string;
    language?: string;
    version?: string;
  };
  files: Array<{ name: string; language: string; content: string }>;
  totalBytes: number;
  rawJson: string;
}

export interface LabImportModalProps {
  bundle: PendingImportBundle;
  isHant: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LabImportModal: React.FC<LabImportModalProps> = ({
  bundle,
  isHant,
  onConfirm,
  onCancel,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap 与 Escape 关闭
  useEffect(() => {
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="lab-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
        data-testid="lab-import-modal"
        className="lab-modal-card theme-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* 对话框头部 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📥</span>
            <h2
              id="import-dialog-title"
              style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#f8fafc' }}
            >
              {tr('审阅并导入外部实验代码包', '審閱並匯入外部實驗程式碼包')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={tr('关闭对话框', '關閉對話框')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* 对话框主体内容 */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, fontSize: '13px' }}>
          {/* 安全警告横幅 */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>
              🛡️ {tr('安全提示：外部不受信代码隔离政策', '安全提示：外部不受信程式碼隔離政策')}
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#fecaca' }}>
              {tr(
                '此代码来自外部文件，来源标记为「外部导入 (imported)」。出于安全防御策略，导入后绝不会自动运行，必须由您在工作台手动审阅并点击「运行代码」。',
                '此程式碼來自外部檔案，來源標記為「外部匯入 (imported)」。出於安全防禦策略，匯入後絕不會自動執行，必須由您在工作台手動審閱並點擊「執行程式碼」。'
              )}
            </p>
          </div>

          {/* Manifest 元信息 */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 12px' }}>
              <span style={{ color: '#94a3b8' }}>{tr('实验标题', '實驗標題')}：</span>
              <strong style={{ color: '#e2e8f0' }}>{bundle.manifest.title || 'Untitled'}</strong>

              <span style={{ color: '#94a3b8' }}>{tr('标识符', '標識符')}：</span>
              <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{bundle.manifest.slug || 'custom'}</span>

              <span style={{ color: '#94a3b8' }}>{tr('推荐环境', '推薦環境')}：</span>
              <span style={{ color: '#e2e8f0' }}>
                {bundle.manifest.language || 'html-css-js'} (Browser DOM)
              </span>

              <span style={{ color: '#94a3b8' }}>{tr('文件统计', '檔案統計')}：</span>
              <span style={{ color: '#e2e8f0' }}>
                {bundle.files.length} {tr('个文件', '個檔案')} · {(bundle.totalBytes / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>

          {/* 文件列表 */}
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: '12px' }}>
              {tr('包含的源文件列表', '包含的原始檔列表')}：
            </span>
          </div>
          <div
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#090d16',
            }}
          >
            {bundle.files.map((file, i) => (
              <div
                key={file.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderBottom:
                    i < bundle.files.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                <span style={{ color: '#e2e8f0' }}>📄 {file.name}</span>
                <span style={{ color: '#64748b' }}>
                  {(file.content.length / 1024).toFixed(1)} KB ({file.language})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: '#0a0f1d',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            data-testid="btn-cancel-import"
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {tr('取消', '取消')}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            data-testid="btn-confirm-import"
            style={{
              padding: '8px 20px',
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📥</span>
            <span>{tr('确认导入并加载 (保持空闲)', '確認匯入並載入 (保持空閒)')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
