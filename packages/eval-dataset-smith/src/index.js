function buildEvalDataset(items, options = {}) {
  const maxPerType = options.maxPerType ?? 20;
  const grouped = groupBy(items, item => item.type ?? "general");
  return Object.entries(grouped).flatMap(([type, values]) =>
    values.slice(0, maxPerType).map((item, index) => ({
      id: item.id ?? `${type}-${index + 1}`,
      input: item.input ?? item.question ?? item.prompt,
      expected: item.expected ?? item.answer ?? item.acceptance,
      tags: [...new Set([type, ...(item.tags ?? [])])],
      source: item.source
    }))
  ).filter(item => item.input && item.expected);
}

function stratifiedSplit(items, ratio = 0.8) {
  const train = [], test = [];
  for (const group of Object.values(groupBy(items, item => (item.tags ?? ["general"])[0]))) {
    const cut = Math.ceil(group.length * ratio);
    train.push(...group.slice(0, cut));
    test.push(...group.slice(cut));
  }
  return { train, test };
}

function groupBy(items, keyFn) {
  return items.reduce((acc, item) => ((acc[keyFn(item)] ??= []).push(item), acc), {});
}

export { buildEvalDataset, stratifiedSplit };

