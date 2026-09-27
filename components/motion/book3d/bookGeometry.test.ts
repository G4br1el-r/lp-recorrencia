import type { BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { createBookGeometry } from "@/components/motion/book3d/bookGeometry";
import { BOOK_PROPORTION } from "@/components/motion/book3d/bookTextures";

const FACE = {
  foreEdge: 0,
  spine: 1,
  head: 2,
  tail: 3,
  front: 4,
  back: 5,
} as const;
const FACE_COUNT = Object.keys(FACE).length;
const VERTICES_PER_TRIANGLE = 3;
const TRIANGLES_PER_QUAD = 2;
const VERTICES_PER_QUAD = TRIANGLES_PER_QUAD * VERTICES_PER_TRIANGLE;
const SIDE = { front: 1, back: -1 } as const;
const FLAT_EDGE_OUTLINE_POINTS = 2;
const ARC_CLOSING_POINT = 1;
const POSITION_TOLERANCE = 1e-6;
const HALF = 0.5;

type Point = { x: number; y: number; z: number };

function groupOf(geometry: BufferGeometry, face: number) {
  const group = geometry.groups.find(
    ({ materialIndex }) => materialIndex === face,
  );
  if (!group) {
    throw new Error(`Grupo de material ausente: ${face}`);
  }
  return group;
}

function pointsOf(geometry: BufferGeometry, face: number): Point[] {
  const position = geometry.getAttribute("position");
  const { start, count } = groupOf(geometry, face);
  return Array.from({ length: count }, (_, offset) => ({
    x: position.getX(start + offset),
    y: position.getY(start + offset),
    z: position.getZ(start + offset),
  }));
}

function spineSegmentsOf(geometry: BufferGeometry): number {
  return groupOf(geometry, FACE.spine).count / VERTICES_PER_QUAD;
}

describe("createBookGeometry", () => {
  it("cria um grupo de material para cada uma das 6 faces", () => {
    const geometry = createBookGeometry();

    expect(geometry.groups).toHaveLength(FACE_COUNT);
    expect(geometry.groups.map(({ materialIndex }) => materialIndex)).toEqual(
      Object.values(FACE),
    );
  });

  it("encadeia os grupos sem sobreposição e cobre todos os vértices", () => {
    const geometry = createBookGeometry();
    let expectedStart = 0;

    for (const group of geometry.groups) {
      expect(group.start).toBe(expectedStart);
      expect(group.count % VERTICES_PER_TRIANGLE).toBe(0);
      expectedStart += group.count;
    }
    expect(geometry.getAttribute("position").count).toBe(expectedStart);
    expect(geometry.getAttribute("normal").count).toBe(expectedStart);
    expect(geometry.getAttribute("uv").count).toBe(expectedStart);
  });

  it("usa um quad por face plana e contagens coerentes com os segmentos da lombada", () => {
    const geometry = createBookGeometry();
    const segments = spineSegmentsOf(geometry);
    const endCapTriangles =
      FLAT_EDGE_OUTLINE_POINTS + segments + ARC_CLOSING_POINT;

    expect(Number.isInteger(segments)).toBe(true);
    expect(segments).toBeGreaterThan(0);
    expect(groupOf(geometry, FACE.front).count).toBe(VERTICES_PER_QUAD);
    expect(groupOf(geometry, FACE.back).count).toBe(VERTICES_PER_QUAD);
    expect(groupOf(geometry, FACE.foreEdge).count).toBe(VERTICES_PER_QUAD);
    expect(groupOf(geometry, FACE.head).count).toBe(
      endCapTriangles * VERTICES_PER_TRIANGLE,
    );
    expect(groupOf(geometry, FACE.tail).count).toBe(
      endCapTriangles * VERTICES_PER_TRIANGLE,
    );
  });

  it("calcula a esfera envolvente contendo todos os vértices", () => {
    const geometry = createBookGeometry();
    const sphere = geometry.boundingSphere;
    if (!sphere) {
      throw new Error("boundingSphere não foi calculada");
    }
    const position = geometry.getAttribute("position");

    expect(sphere.radius).toBeGreaterThan(0);
    for (let index = 0; index < position.count; index += 1) {
      const distance = Math.hypot(
        position.getX(index) - sphere.center.x,
        position.getY(index) - sphere.center.y,
        position.getZ(index) - sphere.center.z,
      );
      expect(distance).toBeLessThanOrEqual(sphere.radius + POSITION_TOLERANCE);
    }
  });

  it.each([
    { face: FACE.front, side: SIDE.front },
    { face: FACE.back, side: SIDE.back },
  ])(
    "mantém os vértices da face $face dentro das proporções do livro",
    ({ face, side }) => {
      const { width, height, depth } = BOOK_PROPORTION;
      const points = pointsOf(createBookGeometry(), face);

      for (const { x, y, z } of points) {
        expect(Math.abs(x)).toBeLessThanOrEqual(
          width * HALF + POSITION_TOLERANCE,
        );
        expect(Math.abs(y)).toBeLessThanOrEqual(
          height * HALF + POSITION_TOLERANCE,
        );
        expect(z).toBeCloseTo(side * depth * HALF);
      }
    },
  );

  it("mantém toda a geometria dentro da caixa do livro", () => {
    const { width, height, depth } = BOOK_PROPORTION;
    const geometry = createBookGeometry();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) {
      throw new Error("boundingBox não foi calculada");
    }

    expect(box.min.x).toBeCloseTo(-width * HALF);
    expect(box.max.x).toBeCloseTo(width * HALF);
    expect(box.min.y).toBeCloseTo(-height * HALF);
    expect(box.max.y).toBeCloseTo(height * HALF);
    expect(box.min.z).toBeCloseTo(-depth * HALF);
    expect(box.max.z).toBeCloseTo(depth * HALF);
  });
});
