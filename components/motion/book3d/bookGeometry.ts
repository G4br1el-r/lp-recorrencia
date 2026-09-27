import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import { BOOK_PROPORTION } from "./bookTextures";

const FACE = {
  foreEdge: 0,
  spine: 1,
  head: 2,
  tail: 3,
  front: 4,
  back: 5,
} as const;
const FACE_COUNT = 6;
const SPINE_SEGMENTS = 16;

type Vec3 = readonly [number, number, number];
type Vertex = { position: Vec3; normal: Vec3; uv: readonly [number, number] };
type ArcPoint = { x: number; z: number; normal: Vec3 };

const edgeA = new Vector3();
const edgeB = new Vector3();

export function createBookGeometry(): BufferGeometry {
  const { width, height, depth } = BOOK_PROPORTION;
  const radius = depth / 2;
  const spineX = -width / 2 + radius;
  const foreX = width / 2;
  const top = height / 2;
  const bottom = -height / 2;
  const faces: Vertex[][] = Array.from({ length: FACE_COUNT }, () => []);

  const triangle = (
    face: number,
    a: Vertex,
    b: Vertex,
    c: Vertex,
    outward: Vec3,
  ) => {
    edgeA.set(...b.position).sub(new Vector3(...a.position));
    edgeB.set(...c.position).sub(new Vector3(...a.position));
    const facing = edgeA.cross(edgeB).dot(new Vector3(...outward));
    faces[face].push(...(facing >= 0 ? [a, b, c] : [a, c, b]));
  };
  const quad = (face: number, corners: readonly Vertex[], outward: Vec3) => {
    triangle(face, corners[0], corners[1], corners[2], outward);
    triangle(face, corners[0], corners[2], corners[3], outward);
  };
  const v = (y: number) => (y - bottom) / height;

  const flatWidth = foreX - spineX;
  for (const side of [1, -1] as const) {
    const z = radius * side;
    const normal: Vec3 = [0, 0, side];
    const u = (x: number) =>
      side === 1 ? (x - spineX) / flatWidth : (foreX - x) / flatWidth;
    quad(
      side === 1 ? FACE.front : FACE.back,
      [spineX, foreX, foreX, spineX].map((x, index): Vertex => {
        const y = index < 2 ? bottom : top;
        return { position: [x, y, z], normal, uv: [u(x), v(y)] };
      }),
      normal,
    );
  }

  quad(
    FACE.foreEdge,
    [radius, -radius, -radius, radius].map((z, index): Vertex => {
      const y = index < 2 ? bottom : top;
      return {
        position: [foreX, y, z],
        normal: [1, 0, 0],
        uv: [(radius - z) / depth, v(y)],
      };
    }),
    [1, 0, 0],
  );

  const arc = (angle: number): ArcPoint => ({
    x: spineX - radius * Math.sin(angle),
    z: radius * Math.cos(angle),
    normal: [-Math.sin(angle), 0, Math.cos(angle)],
  });
  for (let segment = 0; segment < SPINE_SEGMENTS; segment += 1) {
    const from = (segment / SPINE_SEGMENTS) * Math.PI;
    const to = ((segment + 1) / SPINE_SEGMENTS) * Math.PI;
    const a = arc(from);
    const b = arc(to);
    const middle = arc((from + to) / 2);
    const u = (angle: number) => angle / Math.PI;
    quad(
      FACE.spine,
      [
        { position: [a.x, bottom, a.z], normal: a.normal, uv: [u(from), 0] },
        { position: [b.x, bottom, b.z], normal: b.normal, uv: [u(to), 0] },
        { position: [b.x, top, b.z], normal: b.normal, uv: [u(to), 1] },
        { position: [a.x, top, a.z], normal: a.normal, uv: [u(from), 1] },
      ],
      middle.normal,
    );
  }

  const outline: [number, number][] = [
    [foreX, -radius],
    [foreX, radius],
  ];
  for (let segment = 0; segment <= SPINE_SEGMENTS; segment += 1) {
    const point = arc((segment / SPINE_SEGMENTS) * Math.PI);
    outline.push([point.x, point.z]);
  }
  const centerX = (spineX + foreX) / 2;
  for (const end of ["head", "tail"] as const) {
    const y = end === "head" ? top : bottom;
    const normal: Vec3 = [0, end === "head" ? 1 : -1, 0];
    const vertex = (x: number, z: number): Vertex => ({
      position: [x, y, z],
      normal,
      uv: [
        (x + width / 2) / width,
        end === "head" ? (radius - z) / depth : (z + radius) / depth,
      ],
    });
    const center = vertex(centerX, 0);
    outline.forEach(([x, z], index) => {
      const [nextX, nextZ] = outline[(index + 1) % outline.length];
      triangle(
        end === "head" ? FACE.head : FACE.tail,
        center,
        vertex(x, z),
        vertex(nextX, nextZ),
        normal,
      );
    });
  }

  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  let start = 0;
  faces.forEach((vertices, materialIndex) => {
    for (const vertex of vertices) {
      positions.push(...vertex.position);
      normals.push(...vertex.normal);
      uvs.push(...vertex.uv);
    }
    geometry.addGroup(start, vertices.length, materialIndex);
    start += vertices.length;
  });
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();
  return geometry;
}
