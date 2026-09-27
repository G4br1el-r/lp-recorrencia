import {
  AmbientLight,
  type BufferGeometry,
  DirectionalLight,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  type MeshPhysicalMaterialParameters,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PointLight,
  Scene,
  Texture,
  WebGLRenderer,
} from "three";
import type { StageState } from "@/components/motion/stage";
import { STAGE_PERSPECTIVE_PX } from "@/lib/constants/motion";
import { type EditionId, editions } from "@/lib/content/editions";
import { createBookGeometry } from "./bookGeometry";
import {
  BOOK_PROPORTION,
  type BookTextures,
  createBookTextures,
} from "./bookTextures";

export type StageViewport = {
  width: number;
  height: number;
  vw: number;
  vh: number;
  bookWidth: number;
  pixelRatio: number;
};

export type BookScene = {
  resize: (viewport: StageViewport) => void;
  render: (state: StageState) => void;
  dispose: () => void;
};

const CAMERA_CLIP = { near: 10, far: 8000 } as const;
const MAX_ANISOTROPY = 8;
const MIN_VISIBLE_OPACITY = 0.002;
const PERCENT = 100;
const TRACKED_BOOK_FIELDS = 13;
const TRACKED_LIGHT_FIELDS = 3;

const MATERIAL = {
  cover: { roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.35 },
  pages: { roughness: 0.95 },
} as const;

const LIGHTS = {
  ambient: { color: 0xffe9d2, intensity: 0.3 },
  key: { color: 0xffe4c4, intensity: 3, xVw: -45, yVh: -70, zPx: 1200 },
  fill: { color: 0xffe0c4, intensity: 0.45, xVw: 46, yVh: 18, zPx: 1000 },
  rim: { color: 0xffd2a8, intensity: 4, zPx: -1200 },
} as const;

const REFLECTION = { opacity: 0.3, fadeEnd: 0.42, gap: 0.006 } as const;
const FADE_TEXTURE = { width: 4, height: 256 } as const;
const REFLECTION_HIDDEN_FACES = new Set([2, 3]);

type Disposable = { dispose: () => void };

type BookMesh = {
  mesh: Mesh;
  materials: MeshStandardMaterial[];
  reflection: Mesh;
  reflectionMaterials: MeshStandardMaterial[];
};

function createFadeTexture(): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = FADE_TEXTURE.width;
  canvas.height = FADE_TEXTURE.height;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(REFLECTION.fadeEnd, "#000000");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createBook(
  geometry: BufferGeometry,
  textures: BookTextures,
  backColor: string,
  fade: Texture,
): BookMesh {
  const cover = (parameters: MeshPhysicalMaterialParameters) =>
    new MeshPhysicalMaterial({
      ...MATERIAL.cover,
      ...parameters,
      transparent: true,
    });
  const pages = (map: Texture) =>
    new MeshStandardMaterial({ ...MATERIAL.pages, map, transparent: true });
  const materials = [
    pages(textures.foreEdge),
    cover({ map: textures.spine }),
    pages(textures.headEdge),
    pages(textures.tailEdge),
    cover({ map: textures.front }),
    cover({ color: backColor }),
  ];
  const reflectionMaterials = materials.map((material, face) => {
    const mirror = material.clone();
    mirror.alphaMap = fade;
    mirror.depthWrite = false;
    mirror.visible = !REFLECTION_HIDDEN_FACES.has(face);
    return mirror;
  });
  return {
    mesh: new Mesh(geometry, materials),
    materials,
    reflection: new Mesh(geometry, reflectionMaterials),
    reflectionMaterials,
  };
}

export async function createBookScene(
  host: HTMLElement,
  viewport: StageViewport,
): Promise<BookScene> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping;
  const canvas = renderer.domElement;
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
  });

  const disposables: Disposable[] = [];
  const dispose = () => {
    for (const item of disposables) {
      item.dispose();
    }
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  let textureSets: BookTextures[];
  try {
    const anisotropy = Math.min(
      MAX_ANISOTROPY,
      renderer.capabilities.getMaxAnisotropy(),
    );
    textureSets = await Promise.all(
      editions.map((edition) => createBookTextures(edition, anisotropy)),
    );
  } catch (error) {
    dispose();
    throw error;
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera();
  camera.near = CAMERA_CLIP.near;
  camera.far = CAMERA_CLIP.far;
  camera.position.set(0, 0, STAGE_PERSPECTIVE_PX);

  const geometry = createBookGeometry();
  disposables.push(geometry);

  const fade = createFadeTexture();
  disposables.push(fade);

  const books = new Map<EditionId, BookMesh>();
  editions.forEach((edition, index) => {
    const textures = textureSets[index];
    const book = createBook(geometry, textures, edition.cover.spine, fade);
    disposables.push(
      ...Object.values(textures),
      ...book.materials,
      ...book.reflectionMaterials,
    );
    book.mesh.visible = false;
    book.reflection.visible = false;
    scene.add(book.mesh, book.reflection);
    books.set(edition.id, book);
  });

  const key = new PointLight(LIGHTS.key.color, LIGHTS.key.intensity, 0, 0);
  const fill = new DirectionalLight(LIGHTS.fill.color, LIGHTS.fill.intensity);
  const rim = new DirectionalLight(LIGHTS.rim.color, 0);
  scene.add(
    new AmbientLight(LIGHTS.ambient.color, LIGHTS.ambient.intensity),
    key,
    fill,
    rim,
  );

  let view = viewport;
  let needsRender = true;
  const worldX = (xVw: number) => (xVw * view.vw) / PERCENT;
  const worldY = (yVh: number) => (-yVh * view.vh) / PERCENT;

  const resize = (next: StageViewport) => {
    view = next;
    renderer.setPixelRatio(next.pixelRatio);
    renderer.setSize(next.width, next.height, false);
    camera.aspect = next.width / next.height;
    camera.fov = MathUtils.radToDeg(
      2 * Math.atan(next.height / 2 / STAGE_PERSPECTIVE_PX),
    );
    camera.updateProjectionMatrix();
    key.position.set(
      worldX(LIGHTS.key.xVw),
      worldY(LIGHTS.key.yVh),
      LIGHTS.key.zPx,
    );
    fill.position.set(
      worldX(LIGHTS.fill.xVw),
      worldY(LIGHTS.fill.yVh),
      LIGHTS.fill.zPx,
    );
    needsRender = true;
  };

  const snapshot = new Float64Array(
    editions.length * TRACKED_BOOK_FIELDS + TRACKED_LIGHT_FIELDS,
  ).fill(Number.NaN);

  const hasChanged = (state: StageState): boolean => {
    let index = 0;
    let changed = false;
    const track = (value: number) => {
      if (snapshot[index] !== value) {
        snapshot[index] = value;
        changed = true;
      }
      index += 1;
    };
    for (const edition of editions) {
      const pose = state.books[edition.id];
      const hover = state.hover[edition.id];
      track(pose.xVw);
      track(pose.yVh);
      track(pose.zPx);
      track(pose.scale);
      track(pose.rotationY);
      track(pose.opacity);
      track(pose.reflect);
      track(hover.liftVh);
      track(hover.grow);
      track(hover.face);
      track(hover.tiltX);
      track(hover.tiltY);
      track(hover.dim);
    }
    track(state.light.xVw);
    track(state.light.yVh);
    track(state.light.opacity);
    return changed;
  };

  const render = (state: StageState) => {
    if (!hasChanged(state) && !needsRender) {
      return;
    }
    needsRender = false;
    for (const [id, book] of books) {
      const pose = state.books[id];
      const hover = state.hover[id];
      const opacity = pose.opacity * (1 - hover.dim);
      book.mesh.visible = opacity > MIN_VISIBLE_OPACITY;
      const mirrorOpacity = opacity * pose.reflect * REFLECTION.opacity;
      book.reflection.visible =
        book.mesh.visible && mirrorOpacity > MIN_VISIBLE_OPACITY;
      if (!book.mesh.visible) {
        continue;
      }
      const x = worldX(pose.xVw);
      const restScale = view.bookWidth * pose.scale;
      const scale = restScale * (1 + hover.grow);
      const floor = worldY(pose.yVh) - (BOOK_PROPORTION.height * restScale) / 2;
      const halfHeight = (BOOK_PROPORTION.height * scale) / 2;
      const lift = (hover.liftVh * view.vh) / PERCENT;
      const rotationX = MathUtils.degToRad(hover.tiltX);
      const rotationY = MathUtils.degToRad(
        pose.rotationY * (1 - hover.face) + hover.tiltY,
      );
      book.mesh.position.set(x, floor + halfHeight + lift, pose.zPx);
      book.mesh.rotation.set(rotationX, rotationY, 0);
      book.mesh.scale.setScalar(scale);
      for (const material of book.materials) {
        material.opacity = opacity;
      }
      if (!book.reflection.visible) {
        continue;
      }
      const gap = BOOK_PROPORTION.height * scale * REFLECTION.gap;
      book.reflection.position.set(
        x,
        floor - halfHeight - lift - gap,
        pose.zPx,
      );
      book.reflection.rotation.set(-rotationX, rotationY, 0);
      book.reflection.scale.set(scale, -scale, scale);
      for (const material of book.reflectionMaterials) {
        material.opacity = mirrorOpacity;
      }
    }
    rim.position.set(
      worldX(state.light.xVw),
      worldY(state.light.yVh),
      LIGHTS.rim.zPx,
    );
    rim.intensity = LIGHTS.rim.intensity * state.light.opacity;
    renderer.render(scene, camera);
  };

  resize(viewport);
  host.appendChild(canvas);
  return { resize, render, dispose };
}
