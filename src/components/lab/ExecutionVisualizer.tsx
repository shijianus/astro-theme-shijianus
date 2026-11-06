import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { PresetAlgorithmId } from '../../lib/lab-schema';
import {
  TRACE_PROGRAMS,
  generateExecutionTrace,
  type TraceStep,
} from '../../lib/lab-tracer';

interface ExecutionVisualizerProps {
  initialAlgorithmId?: PresetAlgorithmId;
  compact?: boolean;
}

function readVisualizerLocale(): 'zh-CN' | 'zh-Hant' {
  if (typeof document === 'undefined') return 'zh-CN';
  const attr =
    document.documentElement.getAttribute('data-ui-locale') ||
    document.documentElement.getAttribute('lang') ||
    '';
  if (attr === 'zh-Hant' || attr === 'zh-TW' || attr === 'zh-HK') return 'zh-Hant';
  try {
    if (window.localStorage.getItem('shijianus-locale') === 'zh-Hant') return 'zh-Hant';
  } catch {
    // ignore
  }
  return 'zh-CN';
}

export function ExecutionVisualizer({
  initialAlgorithmId = 'bubble-sort',
  compact = false,
}: ExecutionVisualizerProps) {
  const [uiLocale, setUiLocale] = useState<'zh-CN' | 'zh-Hant'>('zh-CN');
  const isHant = uiLocale === 'zh-Hant';
  const tr = useCallback((zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn), [isHant]);

  const [algorithmId, setAlgorithmId] = useState<PresetAlgorithmId>(initialAlgorithmId);
  const [rawInput, setRawInput] = useState<string>(
    TRACE_PROGRAMS[initialAlgorithmId].defaultInput
  );
  const [targetInput, setTargetInput] = useState<string>(
    String(TRACE_PROGRAMS[initialAlgorithmId].defaultTarget ?? 42)
  );
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(650);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setUiLocale(readVisualizerLocale());
    sync();
    window.addEventListener('shijianus:localechange', sync as EventListener);
    return () => window.removeEventListener('shijianus:localechange', sync as EventListener);
  }, []);

  const handleSelectAlgorithm = (nextId: PresetAlgorithmId) => {
    setIsPlaying(false);
    setAlgorithmId(nextId);
    setRawInput(TRACE_PROGRAMS[nextId].defaultInput);
    if (TRACE_PROGRAMS[nextId].defaultTarget !== undefined) {
      setTargetInput(String(TRACE_PROGRAMS[nextId].defaultTarget));
    }
    setStepIdx(0);
  };

  const traceResult = useMemo(() => {
    const parsedTarget = Number(targetInput);
    return generateExecutionTrace({
      algorithmId,
      rawInput,
      targetValue: Number.isFinite(parsedTarget) ? parsedTarget : 42,
    });
  }, [algorithmId, rawInput, targetInput]);

  const totalSteps = traceResult.steps.length;
  const currentStep: TraceStep | undefined =
    traceResult.steps[Math.min(stepIdx, Math.max(0, totalSteps - 1))];

  useEffect(() => {
    if (stepIdx >= totalSteps) {
      setStepIdx(Math.max(0, totalSteps - 1));
    }
  }, [totalSteps, stepIdx]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, speedMs, totalSteps]);

  const maxArrayVal = useMemo(() => {
    if (!currentStep) return 100;
    return Math.max(...currentStep.arrayState.values.map((v) => Math.abs(v)), 1);
  }, [currentStep]);

  if (!currentStep) return null;

  return (
    <div
      id="lab-execution-visualizer"
      className="lab-visualizer theme-card"
      data-algorithm={algorithmId}
    >
      {/* 1. 顶部算法切换与输入参数栏 */}
      <div className="lab-viz-header">
        <div className="lab-viz-title-block">
          <div className="lab-viz-eyebrow">
            <span className="lab-viz-dot" />
            <span>
              {tr(
                'EXECUTION TRACE ENGINE · 确定性逐步执行追踪器',
                'EXECUTION TRACE ENGINE · 確定性逐步執行追蹤器'
              )}
            </span>
          </div>
          <h3 className="lab-viz-title">{traceResult.program.title}</h3>
          <p className="lab-viz-subtitle">{traceResult.program.subtitle}</p>
        </div>

        <div className="lab-viz-algo-tabs" role="tablist" aria-label={tr('选择可视化算法', '選擇視覺化演算法')}>
          {(Object.keys(TRACE_PROGRAMS) as PresetAlgorithmId[]).map((id) => {
            const active = id === algorithmId;
            const shortName =
              id === 'bubble-sort'
                ? tr('冒泡排序', '氣泡排序')
                : id === 'binary-search'
                ? tr('二分查找', '二分搜尋')
                : tr('递归快速排序', '遞迴快速排序');
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                data-algo-tab={id}
                onClick={() => handleSelectAlgorithm(id)}
                className={`lab-viz-tab ${active ? 'is-active' : ''}`}
              >
                {shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 数据输入与单步播放控制栏 */}
      <div className="lab-viz-controls">
        <div className="lab-viz-inputs">
          <label className="lab-viz-field">
            <span>{tr('输入数组 (逗号分隔，最多 14 项)', '輸入陣列 (逗號分隔，最多 14 項)')}</span>
            <input
              type="text"
              value={rawInput}
              onChange={(e) => {
                setIsPlaying(false);
                setRawInput(e.target.value);
                setStepIdx(0);
              }}
              aria-label={tr('输入数组', '輸入陣列')}
              className="lab-viz-input ignore-opencc"
              data-no-translate="true"
            />
          </label>
          {algorithmId === 'binary-search' && (
            <label className="lab-viz-field is-narrow">
              <span>{tr('查找目标值 (target)', '搜尋目標值 (target)')}</span>
              <input
                type="number"
                value={targetInput}
                onChange={(e) => {
                  setIsPlaying(false);
                  setTargetInput(e.target.value);
                  setStepIdx(0);
                }}
                aria-label={tr('查找目标值', '搜尋目標值')}
                className="lab-viz-input ignore-opencc"
                data-no-translate="true"
              />
            </label>
          )}
        </div>

        <div className="lab-viz-playback">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIdx(0);
            }}
            disabled={stepIdx === 0 && !isPlaying}
            className="lab-viz-btn"
            title={tr('重置到第一步', '重置到第一步')}
            data-testid="viz-btn-reset"
          >
            ⏮ {tr('重置', '重置')}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIdx((p) => Math.max(0, p - 1));
            }}
            disabled={stepIdx <= 0}
            className="lab-viz-btn"
            title={tr('回退一步', '倒退一步')}
            data-testid="viz-btn-prev"
          >
            ◀ {tr('上一步', '上一步')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (stepIdx >= totalSteps - 1) {
                setStepIdx(0);
                setIsPlaying(true);
              } else {
                setIsPlaying((p) => !p);
              }
            }}
            className="lab-viz-btn is-primary"
            data-testid="viz-btn-play"
          >
            {isPlaying
              ? tr('⏸ 暂停', '⏸ 暫停')
              : stepIdx >= totalSteps - 1
              ? tr('↻ 重播', '↻ 重播')
              : tr('▶ 自动播放', '▶ 自動播放')}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIdx((p) => Math.min(totalSteps - 1, p + 1));
            }}
            disabled={stepIdx >= totalSteps - 1}
            className="lab-viz-btn"
            title={tr('前进一步', '前進一步')}
            data-testid="viz-btn-next"
          >
            {tr('下一步', '下一步')} ▶
          </button>

          <select
            aria-label={tr('播放速度', '播放速度')}
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="lab-viz-speed"
          >
            <option value={1100}>{tr('0.5x 慢速', '0.5x 慢速')}</option>
            <option value={650}>{tr('1.0x 标准', '1.0x 標準')}</option>
            <option value={320}>{tr('2.0x 快速', '2.0x 快速')}</option>
            <option value={140}>{tr('4.0x 极速', '4.0x 極速')}</option>
          </select>
        </div>
      </div>

      {/* 3. 时间轴进度滑块与当前步骤横幅 */}
      <div className="lab-viz-timeline-bar">
        <div className="lab-viz-step-badge">
          <span className="step-counter" data-testid="viz-step-counter">
            {tr('步骤', '步驟')} {currentStep.stepIndex} / {totalSteps}
          </span>
          <span className="step-line-indicator" data-testid="viz-active-line">
            {tr('当前执行行', '目前執行行')}: Line {currentStep.line}
          </span>
          <span className={`step-event-tag is-${currentStep.eventType}`}>
            {currentStep.eventType.toUpperCase()}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={stepIdx}
          onChange={(e) => {
            setIsPlaying(false);
            setStepIdx(Number(e.target.value));
          }}
          aria-label={tr('执行步骤时间轴', '執行步驟時間軸')}
          className="lab-viz-scrubber"
          data-testid="viz-timeline-slider"
        />

        <div className="lab-viz-step-desc" data-testid="viz-step-description">
          <span>{currentStep.description}</span>
          {currentStep.conditionResult && (
            <span
              className={`condition-pill ${
                currentStep.conditionResult.passed ? 'is-true' : 'is-false'
              }`}
              data-testid="viz-condition-pill"
            >
              {tr('条件', '條件')} {currentStep.conditionResult.expression} →{' '}
              {currentStep.conditionResult.passed
                ? tr('TRUE (成立)', 'TRUE (成立)')
                : tr('FALSE (不成立)', 'FALSE (不成立)')}
            </span>
          )}
        </div>
      </div>

      {/* 4. 主工作区：左侧源码逐行追踪 + 右侧数据结构/变量/调用栈面板 */}
      <div className={`lab-viz-workbench ${compact ? 'is-compact' : ''}`}>
        {/* 左侧：源码与行号高亮 */}
        <div className="lab-viz-code-pane">
          <div className="pane-header">
            <span>
              {tr(
                '源码执行定位 (Source Code & Line Pointer)',
                '原始碼執行定位 (Source Code & Line Pointer)'
              )}
            </span>
            <small>
              {tr('时间复杂度', '時間複雜度')}: {traceResult.program.complexity.time}
            </small>
          </div>
          <div
            className="code-lines-box ignore-opencc"
            data-no-translate="true"
            data-testid="viz-source-lines"
          >
            {traceResult.program.sourceLines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isCurrent = currentStep.line === lineNum;
              return (
                <div
                  key={lineNum}
                  className={`code-line-row ${isCurrent ? 'is-executing' : ''}`}
                  data-line-number={lineNum}
                  data-active={isCurrent ? 'true' : 'false'}
                >
                  <span className="line-gutter">
                    {isCurrent ? '▶' : ''} {lineNum}
                  </span>
                  <pre className="line-code">{lineText}</pre>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：数组图形舞台 + 变量监视 + 调用栈 */}
        <div className="lab-viz-state-pane">
          {/* 4.1 数组元素与状态柱状图 */}
          <div className="state-card">
            <div className="pane-header">
              <span>
                {tr(
                  '数组状态演化 (Array Elements & Pointers)',
                  '陣列狀態演化 (Array Elements & Pointers)'
                )}
              </span>
              <div className="legend-row">
                <span className="legend-item is-compare">{tr('比较中', '比較中')}</span>
                <span className="legend-item is-swap">{tr('交换/改动', '交換/改動')}</span>
                <span className="legend-item is-pivot">{tr('中点/基准', '中點/基準')}</span>
                <span className="legend-item is-sorted">{tr('已就位/命中', '已就位/命中')}</span>
              </div>
            </div>
            <div className="array-bars-container" data-testid="viz-array-bars">
              {currentStep.arrayState.values.map((val, idx) => {
                const isComparing = currentStep.arrayState.comparingIndices.includes(idx);
                const isSwapped = currentStep.arrayState.swappedIndices.includes(idx);
                const isSorted = currentStep.arrayState.sortedIndices.includes(idx);
                const isPivot = currentStep.arrayState.pivotIndex === idx;
                const isFound = currentStep.arrayState.foundIndex === idx;
                const inRange =
                  !currentStep.arrayState.activeRange ||
                  (idx >= currentStep.arrayState.activeRange[0] &&
                    idx <= currentStep.arrayState.activeRange[1]);

                const heightPct = Math.max(
                  18,
                  Math.round((Math.abs(val) / maxArrayVal) * 100)
                );

                let statusClass = 'is-normal';
                if (isFound || isSorted) statusClass = 'is-sorted';
                if (isPivot) statusClass = 'is-pivot';
                if (isSwapped) statusClass = 'is-swap';
                if (isComparing) statusClass = 'is-compare';

                return (
                  <div
                    key={idx}
                    className={`array-bar-col ${statusClass} ${!inRange ? 'is-dimmed' : ''}`}
                    data-bar-index={idx}
                    data-bar-value={val}
                  >
                    <span className="bar-val ignore-opencc" data-no-translate="true">
                      {val}
                    </span>
                    <div
                      className="bar-pillar"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="bar-idx ignore-opencc" data-no-translate="true">
                      [{idx}]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4.2 变量监视器与调用栈双栏 */}
          <div className="state-dual-grid">
            <div className="state-card">
              <div className="pane-header">
                <span>{tr('变量监视器 (Variables Watch)', '變數監視器 (Variables Watch)')}</span>
              </div>
              <div
                className="vars-grid ignore-opencc"
                data-no-translate="true"
                data-testid="viz-variables-watch"
              >
                {Object.entries(currentStep.variables).map(([k, v]) => (
                  <div key={k} className="var-chip">
                    <span className="var-name">{k}</span>
                    <strong className="var-val">{String(v)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="state-card">
              <div className="pane-header">
                <span>
                  {tr('调用栈', '呼叫堆疊')} (Call Stack · {currentStep.callStack.length}{' '}
                  {tr('帧', '幀')})
                </span>
              </div>
              <div
                className="callstack-list ignore-opencc"
                data-no-translate="true"
                data-testid="viz-call-stack"
              >
                {[...currentStep.callStack].reverse().map((frame, i) => (
                  <div
                    key={frame.id}
                    className={`stack-frame ${i === 0 ? 'is-top-frame' : ''}`}
                  >
                    <span className="frame-fn">
                      {frame.fnName}
                      {frame.args}
                    </span>
                    <span className="frame-line">L{frame.line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 安全边界说明角标 */}
      <div className="lab-viz-footer-note">
        <span>
          🛡️ <strong>{tr('引擎架构说明', '引擎架構說明')}</strong>：
          {tr(
            '本追踪面板由确定性有界状态机（Bounded State Tracer，步数上限 600 步）驱动，专用于教学级代码逐行状态剖析，不调用主站 eval()。如需自由修改任意 HTML/CSS/JS 代码并观察 DOM 渲染，请使用隔离沙盒代码工坊。',
            '本追蹤面板由確定性有界狀態機（Bounded State Tracer，步數上限 600 步）驅動，專用於教學級程式碼逐行狀態剖析，不呼叫主站 eval()。如需自由修改任意 HTML/CSS/JS 程式碼並觀察 DOM 渲染，請使用隔離沙盒程式碼工坊。'
          )}
        </span>
      </div>
    </div>
  );
}
