/**
 * Astro Blog「试验田 Lab」确定性程序执行追踪引擎 (Execution Trace Engine)
 *
 * 架构与安全声明：
 * 1. 本模块是专为教学与算法过程可视化设计的「受限状态机追踪器」(Deterministic Bounded State Tracer)，
 *    绝不使用 `eval()` 或 `new Function()` 在主站线程执行任意代码。
 * 2. 明确区分：
 *    - 通用 HTML/CSS/JS 代码预览运行 -> 由 `lab-sandbox-protocol.ts` 在独立 Opaque-Origin Sandbox Iframe 中完成。
 *    - 算法逐行执行、变量监视、条件分支判定、数组状态演化与调用栈可视化 -> 由本模块生成受步数上限 (`MAX_TRACE_STEPS = 600`) 保护的不可变时间线快照。
 */

import { type PresetAlgorithmId, LAB_SECURITY_LIMITS } from './lab-schema';

export type TraceEventType =
  | 'call'
  | 'loop'
  | 'compare'
  | 'branch'
  | 'swap'
  | 'assign'
  | 'return'
  | 'complete';

export interface TraceCallStackFrame {
  id: string;
  fnName: string;
  args: string;
  line: number;
  depth: number;
}

export interface TraceConditionResult {
  expression: string;
  passed: boolean;
}

export interface TraceArraySnapshot {
  values: number[];
  comparingIndices: number[];
  swappedIndices: number[];
  sortedIndices: number[];
  pivotIndex?: number | null;
  activeRange?: [number, number] | null;
  foundIndex?: number | null;
}

export interface TraceStep {
  stepIndex: number;
  line: number;
  eventType: TraceEventType;
  description: string;
  conditionResult?: TraceConditionResult;
  variables: Record<string, string | number | boolean>;
  arrayState: TraceArraySnapshot;
  callStack: TraceCallStackFrame[];
  outputLog: string[];
}

export interface TraceProgramMetadata {
  id: PresetAlgorithmId;
  title: string;
  subtitle: string;
  sourceLines: string[];
  defaultInput: string;
  defaultTarget?: number;
  complexity: {
    time: string;
    space: string;
  };
}

export interface TraceExecutionResult {
  program: TraceProgramMetadata;
  steps: TraceStep[];
  truncated: boolean;
  inputArray: number[];
  targetValue?: number;
}

export const TRACE_PROGRAMS: Record<PresetAlgorithmId, TraceProgramMetadata> = {
  'bubble-sort': {
    id: 'bubble-sort',
    title: '冒泡排序 (Bubble Sort · 提前终止优化)',
    subtitle: '追踪相邻元素比较、条件分支成立状态、位置交换与有序区收敛',
    defaultInput: '38, 14, 29, 7, 42, 19, 11',
    complexity: {
      time: 'O(n²) 最坏 / O(n) 最优',
      space: 'O(1) 原地交换',
    },
    sourceLines: [
      'function bubbleSort(arr) {',
      '  const n = arr.length;',
      '  for (let i = 0; i < n - 1; i++) {',
      '    let swapped = false;',
      '    for (let j = 0; j < n - 1 - i; j++) {',
      '      if (arr[j] > arr[j + 1]) {',
      '        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];',
      '        swapped = true;',
      '      }',
      '    }',
      '    if (!swapped) break;',
      '  }',
      '  return arr;',
      '}',
    ],
  },
  'binary-search': {
    id: 'binary-search',
    title: '二分查找 (Binary Search · 折半区间收敛)',
    subtitle: '追踪双指针 left/right 收缩、中点 mid 计算与三路条件判断',
    defaultInput: '4, 9, 15, 23, 31, 42, 56, 68, 79',
    defaultTarget: 42,
    complexity: {
      time: 'O(log n)',
      space: 'O(1) 迭代指针',
    },
    sourceLines: [
      'function binarySearch(arr, target) {',
      '  let left = 0;',
      '  let right = arr.length - 1;',
      '  while (left <= right) {',
      '    const mid = Math.floor((left + right) / 2);',
      '    if (arr[mid] === target) {',
      '      return mid;',
      '    }',
      '    if (arr[mid] < target) {',
      '      left = mid + 1;',
      '    } else {',
      '      right = mid - 1;',
      '    }',
      '  }',
      '  return -1;',
      '}',
    ],
  },
  'quick-sort-recursion': {
    id: 'quick-sort-recursion',
    title: '递归快速排序 (QuickSort · 递归调用栈演化)',
    subtitle: '追踪分治基准值 Pivot 选择、分区 Partition 与递归调用栈帧压入弹出',
    defaultInput: '27, 12, 35, 8, 41, 16, 22',
    complexity: {
      time: 'O(n log n) 平均',
      space: 'O(log n) 递归调用栈',
    },
    sourceLines: [
      'function quickSort(arr, low, high) {',
      '  if (low >= high) return;',
      '  const pivotVal = arr[high];',
      '  let pIdx = low;',
      '  for (let j = low; j < high; j++) {',
      '    if (arr[j] < pivotVal) {',
      '      [arr[pIdx], arr[j]] = [arr[j], arr[pIdx]];',
      '      pIdx++;',
      '    }',
      '  }',
      '  [arr[pIdx], arr[high]] = [arr[high], arr[pIdx]];',
      '  quickSort(arr, low, pIdx - 1);',
      '  quickSort(arr, pIdx + 1, high);',
      '}',
    ],
  },
};

/**
 * 解析并净化用户输入的数组字符串（限制长度 2~14，数值范围 -999~999）
 */
export function parseSafeNumberArray(rawInput: string, fallback: number[]): number[] {
  const parts = String(rawInput || '')
    .split(/[\s,，;；]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed: number[] = [];
  for (const part of parts) {
    if (parsed.length >= 14) break;
    const num = Number(part);
    if (Number.isFinite(num)) {
      const clamped = Math.max(-999, Math.min(999, Math.round(num)));
      parsed.push(clamped);
    }
  }

  return parsed.length >= 2 ? parsed : [...fallback];
}

/**
 * 生成冒泡排序的完整执行追踪时间线
 */
function traceBubbleSort(initialArray: number[]): TraceExecutionResult {
  const program = TRACE_PROGRAMS['bubble-sort'];
  const arr = [...initialArray];
  const n = arr.length;
  const steps: TraceStep[] = [];
  const logs: string[] = [];
  const sortedSet = new Set<number>();
  let truncated = false;

  const pushStep = (
    stepData: Omit<TraceStep, 'stepIndex' | 'outputLog'> & { logMsg?: string }
  ) => {
    if (steps.length >= LAB_SECURITY_LIMITS.MAX_TRACE_STEPS) {
      truncated = true;
      return;
    }
    if (stepData.logMsg) {
      logs.push(stepData.logMsg);
    }
    steps.push({
      stepIndex: steps.length + 1,
      line: stepData.line,
      eventType: stepData.eventType,
      description: stepData.description,
      conditionResult: stepData.conditionResult,
      variables: { ...stepData.variables },
      arrayState: {
        values: [...stepData.arrayState.values],
        comparingIndices: [...stepData.arrayState.comparingIndices],
        swappedIndices: [...stepData.arrayState.swappedIndices],
        sortedIndices: [...stepData.arrayState.sortedIndices],
        pivotIndex: stepData.arrayState.pivotIndex ?? null,
        activeRange: stepData.arrayState.activeRange ?? null,
        foundIndex: stepData.arrayState.foundIndex ?? null,
      },
      callStack: stepData.callStack.map((f) => ({ ...f })),
      outputLog: [...logs],
    });
  };

  const baseStack: TraceCallStackFrame[] = [
    { id: 'frame-0', fnName: 'main', args: '()', line: 1, depth: 0 },
    {
      id: 'frame-1',
      fnName: 'bubbleSort',
      args: `([${arr.join(', ')}])`,
      line: 1,
      depth: 1,
    },
  ];

  pushStep({
    line: 2,
    eventType: 'call',
    description: `调用 bubbleSort(arr)，初始化数组长度 n = ${n}`,
    variables: { n, i: '-', j: '-', swapped: false },
    arrayState: {
      values: arr,
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: [],
    },
    callStack: baseStack,
    logMsg: `[Call] bubbleSort([${arr.join(', ')}]) | n = ${n}`,
  });

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    baseStack[1].line = 3;

    pushStep({
      line: 4,
      eventType: 'loop',
      description: `开始第 ${i + 1} 轮外层循环 (i = ${i})，重置 swapped = false`,
      conditionResult: { expression: `i (${i}) < n - 1 (${n - 1})`, passed: true },
      variables: { n, i, j: 0, swapped: false },
      arrayState: {
        values: arr,
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: Array.from(sortedSet),
        activeRange: [0, n - 1 - i],
      },
      callStack: baseStack,
      logMsg: `[Loop] 第 ${i + 1} 趟扫描开始 (未排序区间 0..${n - 1 - i})`,
    });

    for (let j = 0; j < n - 1 - i; j++) {
      const leftVal = arr[j];
      const rightVal = arr[j + 1];
      const shouldSwap = leftVal > rightVal;
      baseStack[1].line = 6;

      pushStep({
        line: 6,
        eventType: 'compare',
        description: `比较 arr[${j}] (${leftVal}) 与 arr[${j + 1}] (${rightVal})：${
          shouldSwap ? `${leftVal} > ${rightVal} 成立，准备交换` : `${leftVal} <= ${rightVal}，保持原序`
        }`,
        conditionResult: {
          expression: `arr[${j}] (${leftVal}) > arr[${j + 1}] (${rightVal})`,
          passed: shouldSwap,
        },
        variables: { n, i, j, 'arr[j]': leftVal, 'arr[j+1]': rightVal, swapped },
        arrayState: {
          values: arr,
          comparingIndices: [j, j + 1],
          swappedIndices: [],
          sortedIndices: Array.from(sortedSet),
          activeRange: [0, n - 1 - i],
        },
        callStack: baseStack,
      });

      if (shouldSwap) {
        arr[j] = rightVal;
        arr[j + 1] = leftVal;
        swapped = true;
        baseStack[1].line = 7;

        pushStep({
          line: 7,
          eventType: 'swap',
          description: `交换 arr[${j}] 与 arr[${j + 1}]：${leftVal} ⇄ ${rightVal}，标记 swapped = true`,
          variables: { n, i, j, 'arr[j]': arr[j], 'arr[j+1]': arr[j + 1], swapped: true },
          arrayState: {
            values: arr,
            comparingIndices: [],
            swappedIndices: [j, j + 1],
            sortedIndices: Array.from(sortedSet),
            activeRange: [0, n - 1 - i],
          },
          callStack: baseStack,
          logMsg: `  [Swap] index ${j} ⇄ ${j + 1} (${leftVal} ⇄ ${rightVal})`,
        });
      }
    }

    sortedSet.add(n - 1 - i);
    baseStack[1].line = 11;

    pushStep({
      line: 11,
      eventType: 'branch',
      description: !swapped
        ? `本轮未发生任何交换 (!swapped === true)，触发提前终止 break！`
        : `第 ${i + 1} 轮完成，位置 ${n - 1 - i} (值 ${arr[n - 1 - i]}) 已锁定在最终有序区`,
      conditionResult: {
        expression: `!swapped (${!swapped})`,
        passed: !swapped,
      },
      variables: { n, i, swapped },
      arrayState: {
        values: arr,
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: Array.from(sortedSet),
      },
      callStack: baseStack,
      logMsg: !swapped
        ? `[Early Exit] 检测到序列已有序，提前结束循环`
        : `[Pass Done] 元素 ${arr[n - 1 - i]} 就位 (index ${n - 1 - i})`,
    });

    if (!swapped) {
      break;
    }
  }

  for (let k = 0; k < n; k++) sortedSet.add(k);
  baseStack[1].line = 13;

  pushStep({
    line: 13,
    eventType: 'complete',
    description: `排序完成！返回有序数组 [${arr.join(', ')}]`,
    variables: { n, result: `[${arr.join(', ')}]` },
    arrayState: {
      values: arr,
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: Array.from(sortedSet),
    },
    callStack: [{ id: 'frame-0', fnName: 'main', args: '()', line: 13, depth: 0 }],
    logMsg: `[Return] [${arr.join(', ')}]`,
  });

  return {
    program,
    steps,
    truncated,
    inputArray: initialArray,
  };
}

/**
 * 生成二分查找的完整执行追踪时间线
 */
function traceBinarySearch(initialArray: number[], target: number): TraceExecutionResult {
  const program = TRACE_PROGRAMS['binary-search'];
  // 二分查找前提是有序数组，自动对其进行升序整理以保证算法演示正确
  const arr = [...initialArray].sort((a, b) => a - b);
  const steps: TraceStep[] = [];
  const logs: string[] = [];
  let truncated = false;

  const pushStep = (
    stepData: Omit<TraceStep, 'stepIndex' | 'outputLog'> & { logMsg?: string }
  ) => {
    if (steps.length >= LAB_SECURITY_LIMITS.MAX_TRACE_STEPS) {
      truncated = true;
      return;
    }
    if (stepData.logMsg) logs.push(stepData.logMsg);
    steps.push({
      stepIndex: steps.length + 1,
      line: stepData.line,
      eventType: stepData.eventType,
      description: stepData.description,
      conditionResult: stepData.conditionResult,
      variables: { ...stepData.variables },
      arrayState: {
        values: [...stepData.arrayState.values],
        comparingIndices: [...stepData.arrayState.comparingIndices],
        swappedIndices: [...stepData.arrayState.swappedIndices],
        sortedIndices: [...stepData.arrayState.sortedIndices],
        pivotIndex: stepData.arrayState.pivotIndex ?? null,
        activeRange: stepData.arrayState.activeRange ?? null,
        foundIndex: stepData.arrayState.foundIndex ?? null,
      },
      callStack: stepData.callStack.map((f) => ({ ...f })),
      outputLog: [...logs],
    });
  };

  let left = 0;
  let right = arr.length - 1;
  const baseStack: TraceCallStackFrame[] = [
    { id: 'frame-0', fnName: 'main', args: '()', line: 1, depth: 0 },
    {
      id: 'frame-1',
      fnName: 'binarySearch',
      args: `(arr, target=${target})`,
      line: 2,
      depth: 1,
    },
  ];

  pushStep({
    line: 2,
    eventType: 'call',
    description: `进入 binarySearch，初始化搜索区间 left = 0, right = ${right}，目标值 target = ${target}`,
    variables: { target, left, right, mid: '-' },
    arrayState: {
      values: arr,
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: [],
      activeRange: [left, right],
    },
    callStack: baseStack,
    logMsg: `[Call] binarySearch([${arr.join(', ')}], target=${target})`,
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = arr[mid];
    baseStack[1].line = 5;

    pushStep({
      line: 5,
      eventType: 'assign',
      description: `计算区间 [${left}, ${right}] 的中点索引 mid = Math.floor((${left} + ${right}) / 2) = ${mid}，对应值 arr[${mid}] = ${midVal}`,
      conditionResult: { expression: `left (${left}) <= right (${right})`, passed: true },
      variables: { target, left, right, mid, 'arr[mid]': midVal },
      arrayState: {
        values: arr,
        comparingIndices: [mid],
        swappedIndices: [],
        sortedIndices: [],
        pivotIndex: mid,
        activeRange: [left, right],
      },
      callStack: baseStack,
      logMsg: `[Probe] left=${left}, right=${right} -> mid=${mid} (arr[${mid}]=${midVal})`,
    });

    const isHit = midVal === target;
    baseStack[1].line = 6;

    pushStep({
      line: 6,
      eventType: 'compare',
      description: isHit
        ? `命中目标！arr[${mid}] (${midVal}) === target (${target})`
        : `比较 arr[${mid}] (${midVal}) === target (${target}) 不成立，继续判断大小方向`,
      conditionResult: {
        expression: `arr[${mid}] (${midVal}) === target (${target})`,
        passed: isHit,
      },
      variables: { target, left, right, mid, 'arr[mid]': midVal },
      arrayState: {
        values: arr,
        comparingIndices: [mid],
        swappedIndices: [],
        sortedIndices: [],
        pivotIndex: mid,
        activeRange: [left, right],
        foundIndex: isHit ? mid : null,
      },
      callStack: baseStack,
    });

    if (isHit) {
      baseStack[1].line = 7;
      pushStep({
        line: 7,
        eventType: 'complete',
        description: `查找成功！在索引 mid = ${mid} 处找到目标值 ${target}，函数返回 ${mid}`,
        variables: { target, left, right, mid, returnValue: mid },
        arrayState: {
          values: arr,
          comparingIndices: [],
          swappedIndices: [],
          sortedIndices: [mid],
          foundIndex: mid,
        },
        callStack: [{ id: 'frame-0', fnName: 'main', args: '()', line: 7, depth: 0 }],
        logMsg: `[Found] Target ${target} found at index ${mid}`,
      });
      return {
        program,
        steps,
        truncated,
        inputArray: arr,
        targetValue: target,
      };
    }

    const isLess = midVal < target;
    if (isLess) {
      left = mid + 1;
      baseStack[1].line = 10;
      pushStep({
        line: 10,
        eventType: 'branch',
        description: `因为 arr[${mid}] (${midVal}) < target (${target})，舍弃左半区间，更新 left = ${mid} + 1 = ${left}`,
        conditionResult: {
          expression: `arr[${mid}] (${midVal}) < target (${target})`,
          passed: true,
        },
        variables: { target, left, right, mid, 'arr[mid]': midVal },
        arrayState: {
          values: arr,
          comparingIndices: [],
          swappedIndices: [],
          sortedIndices: [],
          activeRange: left <= right ? [left, right] : null,
        },
        callStack: baseStack,
        logMsg: `  [Narrow Right] arr[${mid}] < ${target} -> left = ${left}`,
      });
    } else {
      right = mid - 1;
      baseStack[1].line = 12;
      pushStep({
        line: 12,
        eventType: 'branch',
        description: `因为 arr[${mid}] (${midVal}) > target (${target})，舍弃右半区间，更新 right = ${mid} - 1 = ${right}`,
        conditionResult: {
          expression: `arr[${mid}] (${midVal}) < target (${target})`,
          passed: false,
        },
        variables: { target, left, right, mid, 'arr[mid]': midVal },
        arrayState: {
          values: arr,
          comparingIndices: [],
          swappedIndices: [],
          sortedIndices: [],
          activeRange: left <= right ? [left, right] : null,
        },
        callStack: baseStack,
        logMsg: `  [Narrow Left] arr[${mid}] > ${target} -> right = ${right}`,
      });
    }
  }

  pushStep({
    line: 15,
    eventType: 'complete',
    description: `循环条件 left (${left}) <= right (${right}) 不再成立，目标值 ${target} 不存在，返回 -1`,
    conditionResult: { expression: `left (${left}) <= right (${right})`, passed: false },
    variables: { target, left, right, returnValue: -1 },
    arrayState: {
      values: arr,
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: [],
    },
    callStack: [{ id: 'frame-0', fnName: 'main', args: '()', line: 15, depth: 0 }],
    logMsg: `[Not Found] Return -1`,
  });

  return {
    program,
    steps,
    truncated,
    inputArray: arr,
    targetValue: target,
  };
}

/**
 * 生成递归快速排序的完整执行追踪时间线（含动态递归调用栈演化）
 */
function traceQuickSortRecursion(initialArray: number[]): TraceExecutionResult {
  const program = TRACE_PROGRAMS['quick-sort-recursion'];
  const arr = [...initialArray];
  const steps: TraceStep[] = [];
  const logs: string[] = [];
  const sortedSet = new Set<number>();
  let truncated = false;
  let frameCounter = 1;

  const callStack: TraceCallStackFrame[] = [
    { id: 'frame-0', fnName: 'main', args: '()', line: 1, depth: 0 },
  ];

  const pushStep = (
    stepData: Omit<TraceStep, 'stepIndex' | 'outputLog' | 'callStack'> & { logMsg?: string }
  ) => {
    if (steps.length >= LAB_SECURITY_LIMITS.MAX_TRACE_STEPS) {
      truncated = true;
      return;
    }
    if (stepData.logMsg) logs.push(stepData.logMsg);
    steps.push({
      stepIndex: steps.length + 1,
      line: stepData.line,
      eventType: stepData.eventType,
      description: stepData.description,
      conditionResult: stepData.conditionResult,
      variables: { ...stepData.variables },
      arrayState: {
        values: [...stepData.arrayState.values],
        comparingIndices: [...stepData.arrayState.comparingIndices],
        swappedIndices: [...stepData.arrayState.swappedIndices],
        sortedIndices: Array.from(sortedSet),
        pivotIndex: stepData.arrayState.pivotIndex ?? null,
        activeRange: stepData.arrayState.activeRange ?? null,
      },
      callStack: callStack.map((f) => ({ ...f })),
      outputLog: [...logs],
    });
  };

  function quickSortRec(low: number, high: number, depth: number) {
    if (steps.length >= LAB_SECURITY_LIMITS.MAX_TRACE_STEPS) return;

    const frameId = `frame-${frameCounter++}`;
    callStack.push({
      id: frameId,
      fnName: 'quickSort',
      args: `(arr, low=${low}, high=${high})`,
      line: 1,
      depth,
    });

    const isBaseCase = low >= high;
    callStack[callStack.length - 1].line = 2;

    if (low === high && low >= 0 && low < arr.length) {
      sortedSet.add(low);
    }

    pushStep({
      line: 2,
      eventType: isBaseCase ? 'return' : 'call',
      description: isBaseCase
        ? `递归栈深度 ${depth}：区间 [${low}, ${high}] 长度 <= 1，触发递归基 (low >= high)，直接返回`
        : `压入调用栈 (深度 ${depth})：执行 quickSort(arr, low=${low}, high=${high})`,
      conditionResult: { expression: `low (${low}) >= high (${high})`, passed: isBaseCase },
      variables: { low, high, stackDepth: depth },
      arrayState: {
        values: arr,
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: Array.from(sortedSet),
        activeRange: !isBaseCase ? [low, high] : null,
      },
      logMsg: `${'  '.repeat(depth - 1)}[Call depth=${depth}] quickSort(low=${low}, high=${high})${
        isBaseCase ? ' -> base case return' : ''
      }`,
    });

    if (isBaseCase) {
      callStack.pop();
      return;
    }

    const pivotVal = arr[high];
    let pIdx = low;
    callStack[callStack.length - 1].line = 3;

    pushStep({
      line: 3,
      eventType: 'assign',
      description: `选择区间右端 arr[${high}] = ${pivotVal} 作为基准值 (Pivot)，初始化分区指针 pIdx = ${low}`,
      variables: { low, high, pivotVal, pIdx, stackDepth: depth },
      arrayState: {
        values: arr,
        comparingIndices: [],
        swappedIndices: [],
        sortedIndices: Array.from(sortedSet),
        pivotIndex: high,
        activeRange: [low, high],
      },
    });

    for (let j = low; j < high; j++) {
      const currentVal = arr[j];
      const isSmaller = currentVal < pivotVal;
      callStack[callStack.length - 1].line = 6;

      pushStep({
        line: 6,
        eventType: 'compare',
        description: `扫描 arr[${j}] (${currentVal}) 与基准值 pivotVal (${pivotVal}) 比较：${
          isSmaller ? `${currentVal} < ${pivotVal} 成立，归入左分区` : `${currentVal} >= ${pivotVal}，留在右侧`
        }`,
        conditionResult: {
          expression: `arr[${j}] (${currentVal}) < pivotVal (${pivotVal})`,
          passed: isSmaller,
        },
        variables: { low, high, pivotVal, pIdx, j, 'arr[j]': currentVal, stackDepth: depth },
        arrayState: {
          values: arr,
          comparingIndices: [j, high],
          swappedIndices: [],
          sortedIndices: Array.from(sortedSet),
          pivotIndex: high,
          activeRange: [low, high],
        },
      });

      if (isSmaller) {
        if (pIdx !== j) {
          const tmp = arr[pIdx];
          arr[pIdx] = arr[j];
          arr[j] = tmp;
        }
        const swappedPair = [pIdx, j];
        pIdx++;
        callStack[callStack.length - 1].line = 7;

        pushStep({
          line: 7,
          eventType: 'swap',
          description: `将小于基准值的元素交换至左分区位置 ${swappedPair[0]}，pIdx 递增至 ${pIdx}`,
          variables: { low, high, pivotVal, pIdx, j, stackDepth: depth },
          arrayState: {
            values: arr,
            comparingIndices: [],
            swappedIndices: swappedPair,
            sortedIndices: Array.from(sortedSet),
            pivotIndex: high,
            activeRange: [low, high],
          },
        });
      }
    }

    // 将 Pivot 放到最终分界位置 pIdx
    const tmpPivot = arr[pIdx];
    arr[pIdx] = arr[high];
    arr[high] = tmpPivot;
    sortedSet.add(pIdx);
    callStack[callStack.length - 1].line = 11;

    pushStep({
      line: 11,
      eventType: 'swap',
      description: `分区完成：将基准值 ${pivotVal} 交换至最终固定位置 pIdx = ${pIdx}`,
      variables: { low, high, pivotVal, pIdx, stackDepth: depth },
      arrayState: {
        values: arr,
        comparingIndices: [],
        swappedIndices: [pIdx, high],
        sortedIndices: Array.from(sortedSet),
        pivotIndex: pIdx,
        activeRange: [low, high],
      },
      logMsg: `${'  '.repeat(depth - 1)}  [Partition] Pivot ${pivotVal} locked at index ${pIdx}`,
    });

    callStack[callStack.length - 1].line = 12;
    quickSortRec(low, pIdx - 1, depth + 1);

    callStack[callStack.length - 1].line = 13;
    quickSortRec(pIdx + 1, high, depth + 1);

    callStack.pop();
  }

  quickSortRec(0, arr.length - 1, 1);

  for (let i = 0; i < arr.length; i++) sortedSet.add(i);

  pushStep({
    line: 14,
    eventType: 'complete',
    description: `所有递归调用栈帧已弹出，快速排序完成！最终结果：[${arr.join(', ')}]`,
    variables: { result: `[${arr.join(', ')}]`, stackDepth: 0 },
    arrayState: {
      values: arr,
      comparingIndices: [],
      swappedIndices: [],
      sortedIndices: Array.from(sortedSet),
    },
    logMsg: `[Complete] Sorted result: [${arr.join(', ')}]`,
  });

  return {
    program,
    steps,
    truncated,
    inputArray: initialArray,
  };
}

/**
 * 统一执行入口：根据算法 ID 与用户输入生成确定性追踪步骤
 */
export function generateExecutionTrace(options: {
  algorithmId: PresetAlgorithmId;
  rawInput?: string;
  targetValue?: number;
}): TraceExecutionResult {
  const { algorithmId, rawInput, targetValue } = options;

  if (algorithmId === 'binary-search') {
    const fallback = [4, 9, 15, 23, 31, 42, 56, 68, 79];
    const arr = parseSafeNumberArray(
      rawInput ?? TRACE_PROGRAMS['binary-search'].defaultInput,
      fallback
    );
    const target =
      typeof targetValue === 'number' && Number.isFinite(targetValue)
        ? targetValue
        : (TRACE_PROGRAMS['binary-search'].defaultTarget ?? 42);
    return traceBinarySearch(arr, target);
  }

  if (algorithmId === 'quick-sort-recursion') {
    const fallback = [27, 12, 35, 8, 41, 16, 22];
    const arr = parseSafeNumberArray(
      rawInput ?? TRACE_PROGRAMS['quick-sort-recursion'].defaultInput,
      fallback
    );
    return traceQuickSortRecursion(arr);
  }

  const fallback = [38, 14, 29, 7, 42, 19, 11];
  const arr = parseSafeNumberArray(
    rawInput ?? TRACE_PROGRAMS['bubble-sort'].defaultInput,
    fallback
  );
  return traceBubbleSort(arr);
}
