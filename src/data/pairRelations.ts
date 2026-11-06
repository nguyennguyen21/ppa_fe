import { mockSubmissions } from "./mock";

export interface PairRelation {
  id: string;
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  aStudent: string;
  bStudent: string;
  similarity: number;
}

type Seed = [string, string, number];

const seeds: Seed[] = [
  ["1", "2", 97],
  ["1", "3", 83],
  ["2", "3", 86],
  ["1", "9", 78],
  ["2", "9", 74],
  ["3", "9", 81],
  ["9", "11", 88],
  ["3", "11", 79],
  ["11", "7", 72],
  ["4", "8", 68],
  ["4", "12", 64],
  ["7", "11", 71],
  ["5", "10", 58],
  ["5", "6", 49],
  ["8", "12", 55],
];

const byId = new Map(mockSubmissions.map((s) => [s.id, s]));

export const pairRelations: PairRelation[] = seeds
  .map(([aId, bId, similarity]) => {
    const a = byId.get(aId);
    const b = byId.get(bId);
    if (!a || !b) return null;
    return {
      id: `${aId}-${bId}`,
      aId,
      bId,
      aName: a.fileName,
      bName: b.fileName,
      aStudent: a.studentName,
      bStudent: b.studentName,
      similarity,
    };
  })
  .filter((p): p is PairRelation => p !== null)
  .sort((x, y) => y.similarity - x.similarity);
