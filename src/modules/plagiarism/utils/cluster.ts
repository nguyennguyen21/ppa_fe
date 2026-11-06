// Mô hình phân cụm các bài mẫu dựa trên 10 chỉ số tĩnh.
// Dùng k-means trên không gian đặc trưng chuẩn hoá, chiếu PCA xuống 2D để vẽ
// biểu đồ phân tán; đồng thời xây mạng k láng giềng gần nhất để vẽ đồ thị.

import { analyzeCode, type AnalysisResult } from "./aiClassify";
import { sampleLibrary, type LibrarySample } from "../../../data/aiSampleLibrary";
import type { SampleKind } from "../../../data/aiSamples";

export interface FeatureDef {
  key: string;
  label: string;
  short: string;
  weight: number;
}

export const CLUSTER_FEATURES: FeatureDef[] = [
  { key: "commentRatio", label: "Mật độ chú thích", short: "Chú thích", weight: 1.6 },
  { key: "variableNameLength", label: "Độ dài tên biến TB", short: "Tên biến", weight: 1.6 },
  { key: "functionNameLength", label: "Độ dài tên hàm TB", short: "Tên hàm", weight: 1.2 },
  { key: "averageLineLength", label: "Độ dài dòng TB", short: "Dòng", weight: 0.7 },
  { key: "blankLineRatio", label: "Tỉ lệ dòng trống", short: "Dòng trống", weight: 0.8 },
  { key: "indentationConsistency", label: "Nhất quán thụt lề", short: "Thụt lề", weight: 0.9 },
  { key: "functionNamingConsistency", label: "Nhất quán tên hàm", short: "Quy ước hàm", weight: 0.7 },
  { key: "variableNamingConsistency", label: "Nhất quán tên biến", short: "Quy ước biến", weight: 0.7 },
  { key: "averageCyclomaticComplexity", label: "Độ phức tạp TB", short: "Phức tạp", weight: 0.6 },
  { key: "maxNestingDepth", label: "Độ sâu lồng nhau", short: "Lồng nhau", weight: 0.6 },
];

export interface ClusterSample {
  sample: LibrarySample;
  analysis: AnalysisResult;
  vector: number[];
  x: number;
  y: number;
  cluster: number;
  distanceToCentroid: number;
}

export interface ClusterGroup {
  id: number;
  color: string;
  soft: string;
  label: string;
  members: ClusterSample[];
  centroid: { x: number; y: number };
  dominantKind: SampleKind;
  meanAi: number;
  meanCommentRatio: number;
}

export interface ClusterEdge {
  a: string;
  b: string;
  weight: number;
}

export interface ClusterModel {
  k: number;
  points: ClusterSample[];
  groups: ClusterGroup[];
  explained: [number, number];
  loadings: {
    pc1: Array<{ key: string; label: string; value: number }>;
    pc2: Array<{ key: string; label: string; value: number }>;
  };
  silhouette: number;
  edges: ClusterEdge[];
  inertia: number;
}

export const CLUSTER_PALETTE = [
  { color: "#d97706", soft: "rgba(217,119,6,0.16)", label: "Cụm 1" },
  { color: "#0284c7", soft: "rgba(2,132,199,0.16)", label: "Cụm 2" },
  { color: "#7c3aed", soft: "rgba(124,58,237,0.16)", label: "Cụm 3" },
  { color: "#0d9488", soft: "rgba(13,148,136,0.16)", label: "Cụm 4" },
];

const KIND_COLOR: Record<SampleKind, string> = {
  ai: "#d97706",
  human: "#059669",
  mixed: "#78716c",
};

function safe(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function vectorFor(sample: LibrarySample) {
  const analysis = analyzeCode(sample.code);
  const raw = CLUSTER_FEATURES.map((feature) => {
    const value = safe(analysis.metrics[feature.key] ?? 0);
    return value * feature.weight;
  });
  return { analysis, raw };
}

function standardize(matrix: number[][]) {
  const n = matrix.length;
  const d = matrix[0].length;
  const means = Array.from({ length: d }, (_, j) =>
    matrix.reduce((sum, row) => sum + row[j], 0) / n,
  );
  const stds = Array.from({ length: d }, (_, j) => {
    const variance =
      matrix.reduce((sum, row) => sum + (row[j] - means[j]) ** 2, 0) / Math.max(1, n - 1);
    return Math.max(1e-9, Math.sqrt(variance));
  });
  return {
    data: matrix.map((row) => row.map((value, j) => (value - means[j]) / stds[j])),
    means,
    stds,
  };
}

function farthestFirstInit(data: number[][], k: number) {
  const chosen: number[] = [];
  const first = data.reduce((best, row, index) => {
    const norm = row.reduce((sum, value) => sum + value * value, 0);
    return norm > best.norm ? { index, norm } : best;
  }, { index: 0, norm: -Infinity }).index;
  chosen.push(first);

  while (chosen.length < k) {
    let bestIndex = -1;
    let bestDistance = -Infinity;
    for (let i = 0; i < data.length; i += 1) {
      if (chosen.includes(i)) continue;
      const minDistance = Math.min(
        ...chosen.map((j) =>
          data[i].reduce((sum, value, d) => sum + (value - data[j][d]) ** 2, 0),
        ),
      );
      if (minDistance > bestDistance) {
        bestDistance = minDistance;
        bestIndex = i;
      }
    }
    if (bestIndex < 0) break;
    chosen.push(bestIndex);
  }
  return chosen;
}

function kMeans(data: number[][], k: number) {
  const n = data.length;
  const d = data[0].length;
  const init = farthestFirstInit(data, k);
  let assignments = data.map((_, index) => {
    const nearest = init.reduce(
      (best, centroid, cluster) => {
        const distance = data[index].reduce(
          (sum, value, dimension) => sum + (value - data[centroid][dimension]) ** 2,
          0,
        );
        return distance < best.distance ? { cluster, distance } : best;
      },
      { cluster: 0, distance: Infinity },
    );
    return nearest.cluster;
  });

  let centroids = Array.from({ length: k }, (_, cluster) => {
    const members = data.filter((_, index) => assignments[index] === cluster);
    if (members.length === 0) return [...data[init[cluster]]];
    return Array.from({ length: d }, (_, dimension) =>
      members.reduce((sum, row) => sum + row[dimension], 0) / members.length,
    );
  });

  let changed = true;
  let iterations = 0;
  while (changed && iterations < 60) {
    changed = false;
    const next = data.map((row) => {
      let bestCluster = 0;
      let bestDistance = Infinity;
      for (let cluster = 0; cluster < k; cluster += 1) {
        const distance = row.reduce(
          (sum, value, dimension) => sum + (value - centroids[cluster][dimension]) ** 2,
          0,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCluster = cluster;
        }
      }
      return bestCluster;
    });

    for (let i = 0; i < n; i += 1) {
      if (next[i] !== assignments[i]) changed = true;
    }
    assignments = next;

    centroids = Array.from({ length: k }, (_, cluster) => {
      const members = data.filter((_, index) => assignments[index] === cluster);
      if (members.length === 0) {
        // Khởi tạo lại từ điểm xa nhất, tránh cụm rỗng.
        let farthest = 0;
        let farthestDistance = -Infinity;
        for (let i = 0; i < n; i += 1) {
          const distance = data[i].reduce(
            (sum, value, dimension) => sum + (value - centroids[cluster][dimension]) ** 2,
            0,
          );
          if (distance > farthestDistance) {
            farthestDistance = distance;
            farthest = i;
          }
        }
        return [...data[farthest]];
      }
      return Array.from({ length: d }, (_, dimension) =>
        members.reduce((sum, row) => sum + row[dimension], 0) / members.length,
      );
    });
    iterations += 1;
  }

  const inertia = data.reduce((sum, row, index) => {
    const centroid = centroids[assignments[index]];
    return (
      sum +
      row.reduce((inner, value, dimension) => inner + (value - centroid[dimension]) ** 2, 0)
    );
  }, 0);

  return { assignments, centroids, inertia };
}

function pca(data: number[][]) {
  const n = data.length;
  const d = data[0].length;
  const means = Array.from({ length: d }, (_, j) =>
    data.reduce((sum, row) => sum + row[j], 0) / n,
  );
  const centered = data.map((row) => row.map((value, j) => value - means[j]));

  const covariance = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) =>
      centered.reduce((sum, row) => sum + row[i] * row[j], 0) / Math.max(1, n - 1),
    ),
  );

  const eigen = (matrix: number[][], previousVector?: number[]) => {
    let vector = previousVector
      ? previousVector.map((value) => -value)
      : Array.from({ length: d }, () => 1 / Math.sqrt(d));
    let eigenvalue = 0;
    for (let iteration = 0; iteration < 200; iteration += 1) {
      const next = Array.from({ length: d }, (_, i) =>
        matrix.reduce((sum, row, j) => sum + row[i] * vector[j], 0),
      );
      const norm = Math.sqrt(next.reduce((sum, value) => sum + value * value, 0));
      if (!Number.isFinite(norm) || norm < 1e-12) break;
      vector = next.map((value) => value / norm);
      eigenvalue = vector.reduce(
        (sum, value, i) => sum + value * matrix.reduce((inner, row, j) => inner + row[i] * vector[j], 0),
        0,
      );
    }
    return { vector, eigenvalue };
  };

  const first = eigen(covariance);
  const deflated = covariance.map((row, i) =>
    row.map((value, j) => value - first.eigenvalue * first.vector[i] * first.vector[j]),
  );
  const second = eigen(deflated);

  // Định hướng trục để chỉ số lớn (chú thích, tên dài) tăng về phía phải/trên.
  const orient = (vector: number[]) => {
    const dominant = vector.reduce(
      (best, value, index) => (Math.abs(value) > Math.abs(best.value) ? { index, value } : best),
      { index: 0, value: vector[0] },
    );
    const feature = CLUSTER_FEATURES[dominant.index];
    const aiFeature =
      feature.key === "commentRatio" || feature.key === "variableNameLength" || feature.key === "functionNameLength";
    if (aiFeature && dominant.value < 0) return vector.map((value) => -value);
    return vector;
  };

  const v1 = orient(first.vector);
  const v2 = orient(second.vector);
  const lambda1 = first.eigenvalue;
  const lambda2 = second.eigenvalue;
  const trace = covariance.reduce((sum, row, i) => sum + row[i], 0);

  const projection = data.map((row, index) => {
    const pc1 = row.reduce((sum, value, j) => sum + value * v1[j], 0);
    const pc2 = row.reduce((sum, value, j) => sum + value * v2[j], 0);
    return { index, pc1, pc2 };
  });

  const normalizeAxis = (values: number[]) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1e-9, max - min);
    return values.map((value) => 0.08 + ((value - min) / span) * 0.84);
  };

  const xs = normalizeAxis(projection.map((point) => point.pc1));
  const ys = normalizeAxis(projection.map((point) => point.pc2));
  const points = projection.map((point, index) => ({ ...point, x: xs[index], y: ys[index] }));

  return {
    points,
    eigenvalues: [lambda1, lambda2],
    explained: [
      trace > 0 ? Math.max(0, lambda1 / trace) : 0,
      trace > 0 ? Math.max(0, lambda2 / trace) : 0,
    ] as [number, number],
    v1,
    v2,
  };
}

function euclidean(a: number[], b: number[]) {
  return Math.sqrt(a.reduce((sum, value, i) => sum + (value - b[i]) ** 2, 0));
}

function silhouetteScore(data: number[][], assignments: number[], k: number) {
  const n = data.length;
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    const ownCluster = assignments[i];
    // Tính a trực tiếp theo chỉ số.
    let intraTotal = 0;
    let intraCount = 0;
    for (let j = 0; j < n; j += 1) {
      if (j === i || assignments[j] !== ownCluster) continue;
      intraTotal += euclidean(data[i], data[j]);
      intraCount += 1;
    }
    const aDistance = intraCount ? intraTotal / intraCount : 0;

    let bDistance = Infinity;
    for (let cluster = 0; cluster < k; cluster += 1) {
      if (cluster === ownCluster) continue;
      const others = data.filter((_, index) => assignments[index] === cluster);
      if (!others.length) continue;
      const meanDistance = others.reduce((sum, row) => sum + euclidean(data[i], row), 0) / others.length;
      bDistance = Math.min(bDistance, meanDistance);
    }
    if (!Number.isFinite(bDistance)) bDistance = 0;
    const score = Math.max(aDistance, bDistance) === 0
      ? 0
      : (bDistance - aDistance) / Math.max(aDistance, bDistance);
    total += score;
  }
  return total / n;
}

function convexHull(points: Array<{ x: number; y: number }>) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length <= 2) return sorted;
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Array<{ x: number; y: number }> = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: Array<{ x: number; y: number }> = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function kindColor(kind: SampleKind) {
  return KIND_COLOR[kind];
}

export function buildClusterModel(k: number): ClusterModel {
  const normalizedK = Math.max(2, Math.min(4, k));
  const prepared = sampleLibrary.map((sample) => {
    const { analysis, raw } = vectorFor(sample);
    return { sample, analysis, raw };
  });

  const standardized = standardize(prepared.map((item) => item.raw));
  const data = standardized.data;
  const { assignments, centroids, inertia } = kMeans(data, normalizedK);

  const projection = pca(data);
  const points: ClusterSample[] = prepared.map((item, index) => {
    const point = projection.points[index];
    return {
      sample: item.sample,
      analysis: item.analysis,
      vector: data[index],
      x: point.x,
      y: point.y,
      cluster: assignments[index],
      distanceToCentroid: euclidean(data[index], centroids[assignments[index]]),
    };
  });

  // Sắp xếp cụm theo mức AI trung bình giảm dần để màu và nhãn nhất quán.
  const clusterMeanAi = Array.from({ length: normalizedK }, (_, cluster) => {
    const members = points.filter((point) => point.cluster === cluster);
    return members.reduce((sum, point) => sum + point.analysis.aiProbability, 0) / Math.max(1, members.length);
  });
  const order = clusterMeanAi
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .map((item) => item.index);
  const remap = new Map(order.map((oldIndex, newIndex) => [oldIndex, newIndex]));
  for (const point of points) point.cluster = remap.get(point.cluster) ?? point.cluster;

  const groups: ClusterGroup[] = Array.from({ length: normalizedK }, (_, cluster) => {
    const members = points.filter((point) => point.cluster === cluster);
    const centroid = {
      x: members.reduce((sum, point) => sum + point.x, 0) / Math.max(1, members.length),
      y: members.reduce((sum, point) => sum + point.y, 0) / Math.max(1, members.length),
    };
    const dominant = members.reduce(
      (best, point) => {
        const counts = best.counts;
        counts[point.sample.kind] += 1;
        return { counts };
      },
      { counts: { ai: 0, human: 0, mixed: 0 } as Record<SampleKind, number> },
    );
    const dominantKind = (Object.entries(dominant.counts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "mixed") as SampleKind;
    const palette = CLUSTER_PALETTE[cluster] ?? CLUSTER_PALETTE[CLUSTER_PALETTE.length - 1];
    return {
      id: cluster,
      color: palette.color,
      soft: palette.soft,
      label: palette.label,
      members,
      centroid,
      dominantKind,
      meanAi: members.reduce((sum, point) => sum + point.analysis.aiProbability, 0) / Math.max(1, members.length),
      meanCommentRatio:
        members.reduce((sum, point) => sum + point.analysis.metrics.commentRatio, 0) / Math.max(1, members.length),
    };
  });

  const silhouette = silhouetteScore(data, points.map((point) => point.cluster), normalizedK);

  // Mạng k láng giềng gần nhất trong không gian đặc trưng.
  const edges: ClusterEdge[] = [];
  const edgeSet = new Set<string>();
  for (let i = 0; i < points.length; i += 1) {
    const distances = points
      .map((point, j) => ({ j, distance: euclidean(points[i].vector, point.vector) }))
      .filter((item) => item.j !== i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
    for (const item of distances) {
      const key = [points[i].sample.id, points[item.j].sample.id].sort().join("::");
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edges.push({
        a: points[i].sample.id,
        b: points[item.j].sample.id,
        weight: 1 / (1 + item.distance),
      });
    }
  }

  const loadings = {
    pc1: CLUSTER_FEATURES.map((feature, index) => ({
      key: feature.key,
      label: feature.label,
      value: projection.v1[index],
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
    pc2: CLUSTER_FEATURES.map((feature, index) => ({
      key: feature.key,
      label: feature.label,
      value: projection.v2[index],
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
  };

  return {
    k: normalizedK,
    points,
    groups,
    explained: projection.explained,
    loadings,
    silhouette,
    edges,
    inertia,
  };
}

export function convexHullFor(points: Array<{ x: number; y: number }>) {
  return convexHull(points);
}


