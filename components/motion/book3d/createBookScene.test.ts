import {
  BufferGeometry,
  DirectionalLight,
  type Material,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type PerspectiveCamera,
  PointLight,
  type Scene,
  Texture,
} from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookTextures } from "@/components/motion/book3d/bookTextures";
import { BOOK_PROPORTION } from "@/components/motion/book3d/bookTextures";
import {
  createBookScene,
  type StageViewport,
} from "@/components/motion/book3d/createBookScene";
import { createStageState, type StageState } from "@/components/motion/stage";
import { STAGE_PERSPECTIVE_PX } from "@/lib/constants/motion";
import { type EditionId, editions } from "@/lib/content/editions";

const mocks = vi.hoisted(() => {
  const GPU_MAX_ANISOTROPY = 16;
  const renderers: FakeRenderer[] = [];

  class FakeRenderer {
    readonly options: { antialias?: boolean };
    readonly domElement = document.createElement("canvas");
    readonly capabilities = { getMaxAnisotropy: () => GPU_MAX_ANISOTROPY };
    toneMapping?: number;
    readonly setClearColor = vi.fn();
    readonly setPixelRatio = vi.fn();
    readonly setSize = vi.fn();
    readonly render =
      vi.fn<(scene: Scene, camera: PerspectiveCamera) => void>();
    readonly dispose = vi.fn();
    readonly forceContextLoss = vi.fn();
    readonly compileAsync =
      vi.fn<(scene: Scene, camera: PerspectiveCamera) => Promise<void>>();
    readonly initTexture = vi.fn<(texture: Texture) => void>();

    constructor(options: { antialias?: boolean } = {}) {
      this.options = options;
      this.compileAsync.mockResolvedValue(undefined);
      renderers.push(this);
    }
  }

  return {
    FakeRenderer,
    renderers,
    createBookTextures: vi.fn(),
    createBookGeometry: vi.fn(),
  };
});

vi.mock("three", async (importOriginal) => ({
  ...(await importOriginal<typeof import("three")>()),
  WebGLRenderer: mocks.FakeRenderer,
}));

vi.mock("@/components/motion/book3d/bookTextures", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/motion/book3d/bookTextures")
  >()),
  createBookTextures: mocks.createBookTextures,
}));

vi.mock("@/components/motion/book3d/bookGeometry", () => ({
  createBookGeometry: mocks.createBookGeometry,
}));

const VIEWPORT: StageViewport = {
  width: 1200,
  height: 800,
  vw: 1200,
  vh: 800,
  bookWidth: 240,
  pixelRatio: 1,
};
const RESIZE_FACTOR = 2;
const RESIZED_VIEWPORT: StageViewport = {
  width: VIEWPORT.width * RESIZE_FACTOR,
  height: VIEWPORT.height * RESIZE_FACTOR,
  vw: VIEWPORT.vw * RESIZE_FACTOR,
  vh: VIEWPORT.vh * RESIZE_FACTOR,
  bookWidth: VIEWPORT.bookWidth * RESIZE_FACTOR,
  pixelRatio: RESIZE_FACTOR,
};
const PERCENT = 100;
const HALF = 0.5;
const FULL_OPACITY = 1;
const FULL_DIM = 1;
const HALF_DIM = 0.5;
const HALF_DIMMED_OPACITY = 0.5;
const FULL_REFLECT = 1;
const NO_REFLECT = 0;
const NEARLY_TRANSPARENT_OPACITY = 0.001;
const MOVED_X_VW = 10;
const POSE_Y_VH = -4;
const POSE_Z_PX = -120;
const POSE_SCALE = 0.8;
const HOVER_GROW = 0.25;
const GROWN_SIZE_RATIO = 1.25;
const HOVER_LIFT_VH = 3;
const MESHES_PER_BOOK = 2;
const CHANGED_VALUE = 7;
const RENDERS_AFTER_TWO_CHANGES = 3;
const RENDERS_AFTER_RESIZE = 2;
const TEXTURE_FAILURE = "falha ao carregar texturas";
const COMPILE_FAILURE = "falha ao compilar shaders";
const TEXTURES_PER_BOOK = 5;
const FADE_TEXTURES = 1;
const CLEARCOAT = 0.3;
const SHOWN_EDITION: EditionId = "traditional";

type Stage = {
  scene: Awaited<ReturnType<typeof createBookScene>>;
  host: HTMLElement;
  renderer: InstanceType<typeof mocks.FakeRenderer>;
};

type RenderedScene = {
  scene: Scene;
  camera: PerspectiveCamera;
};

function fakeTextures(): BookTextures {
  return {
    front: new Texture(),
    spine: new Texture(),
    foreEdge: new Texture(),
    headEdge: new Texture(),
    tailEdge: new Texture(),
  };
}

function lastRenderer(): InstanceType<typeof mocks.FakeRenderer> {
  const renderer = mocks.renderers.at(-1);
  if (!renderer) {
    throw new Error("WebGLRenderer não foi criado");
  }
  return renderer;
}

async function createStage(): Promise<Stage> {
  const host = document.createElement("div");
  const scene = await createBookScene(host, VIEWPORT);
  return { scene, host, renderer: lastRenderer() };
}

function lastRender(stage: Stage): RenderedScene {
  const call = stage.renderer.render.mock.lastCall;
  if (!call) {
    throw new Error("A cena ainda não foi renderizada");
  }
  const [scene, camera] = call;
  return { scene, camera };
}

function bookOf(stage: Stage, id: EditionId) {
  const { scene } = lastRender(stage);
  const meshes = scene.children.filter(
    (child): child is Mesh => child instanceof Mesh,
  );
  const start =
    editions.findIndex((edition) => edition.id === id) * MESHES_PER_BOOK;
  const [mesh, reflection] = meshes.slice(start, start + MESHES_PER_BOOK);
  return { mesh, reflection };
}

function lightsOf(stage: Stage) {
  const { scene } = lastRender(stage);
  const [key] = scene.children.filter(
    (child): child is PointLight => child instanceof PointLight,
  );
  const [fill] = scene.children.filter(
    (child): child is DirectionalLight => child instanceof DirectionalLight,
  );
  return { key, fill };
}

function materialsOf(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function fadeTextureOf(materials: Material[]): Texture {
  const fade = materials
    .filter(
      (material): material is MeshStandardMaterial =>
        material instanceof MeshStandardMaterial,
    )
    .map((material) => material.alphaMap)
    .find((map): map is Texture => map instanceof Texture);
  if (!fade) {
    throw new Error("Textura de fade do reflexo ausente");
  }
  return fade;
}

function visibleState(): StageState {
  const state = createStageState();
  state.books[SHOWN_EDITION].opacity = FULL_OPACITY;
  state.books[SHOWN_EDITION].reflect = FULL_REFLECT;
  return state;
}

describe("createBookScene", () => {
  let geometry: BufferGeometry;
  let textureSets: BookTextures[];

  beforeEach(() => {
    mocks.renderers.length = 0;
    geometry = new BufferGeometry();
    textureSets = [];
    mocks.createBookGeometry.mockReset();
    mocks.createBookGeometry.mockReturnValue(geometry);
    mocks.createBookTextures.mockReset();
    mocks.createBookTextures.mockImplementation(async () => {
      const textures = fakeTextures();
      textureSets.push(textures);
      return textures;
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("compila os shaders com os livros visíveis antes de anexar o canvas", async () => {
    const host = document.createElement("div");
    const visibleDuringCompile: boolean[] = [];
    let attachedDuringCompile = true;
    const created = createBookScene(host, VIEWPORT);
    const renderer = lastRenderer();
    renderer.compileAsync.mockImplementation(async (scene) => {
      attachedDuringCompile = host.contains(renderer.domElement);
      for (const child of scene.children) {
        if (child instanceof Mesh) {
          visibleDuringCompile.push(child.visible);
        }
      }
    });

    const stage = { scene: await created, host, renderer };
    stage.scene.render(createStageState());

    expect(renderer.compileAsync).toHaveBeenCalledOnce();
    expect(attachedDuringCompile).toBe(false);
    expect(visibleDuringCompile.length).toBe(editions.length * MESHES_PER_BOOK);
    expect(visibleDuringCompile.every(Boolean)).toBe(true);
    expect(host.contains(renderer.domElement)).toBe(true);
    for (const edition of editions) {
      expect(bookOf(stage, edition.id).mesh.visible).toBe(false);
    }
  });

  it("envia todas as texturas para a GPU antes de anexar o canvas", async () => {
    const stage = await createStage();

    expect(stage.renderer.initTexture).toHaveBeenCalledTimes(
      editions.length * TEXTURES_PER_BOOK + FADE_TEXTURES,
    );
    for (const textures of textureSets) {
      for (const texture of Object.values(textures)) {
        expect(stage.renderer.initTexture).toHaveBeenCalledWith(texture);
      }
    }
  });

  it("descarta o renderer e rejeita quando a compilação falha", async () => {
    const host = document.createElement("div");
    const created = createBookScene(host, VIEWPORT);
    const renderer = lastRenderer();
    renderer.compileAsync.mockRejectedValue(new Error(COMPILE_FAILURE));

    await expect(created).rejects.toThrow(COMPILE_FAILURE);
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(host.contains(renderer.domElement)).toBe(false);
  });

  it("usa antialias e capa com clearcoat", async () => {
    const stage = await createStage();
    stage.scene.render(visibleState());
    const covers = materialsOf(bookOf(stage, SHOWN_EDITION).mesh).filter(
      (material): material is MeshPhysicalMaterial =>
        material instanceof MeshPhysicalMaterial,
    );

    expect(stage.renderer.options.antialias).toBe(true);
    expect(covers.length).toBeGreaterThan(0);
    expect(covers.every((material) => material.clearcoat === CLEARCOAT)).toBe(
      true,
    );
  });

  it("anexa o canvas ao host e renderiza na primeira chamada", async () => {
    const stage = await createStage();

    stage.scene.render(createStageState());

    expect(stage.host.contains(stage.renderer.domElement)).toBe(true);
    expect(stage.renderer.render).toHaveBeenCalledOnce();
  });

  it("não renderiza de novo quando o estado não muda", async () => {
    const stage = await createStage();

    stage.scene.render(visibleState());
    stage.scene.render(visibleState());

    expect(stage.renderer.render).toHaveBeenCalledOnce();
  });

  it("renderiza de novo quando qualquer campo acompanhado muda", async () => {
    const stage = await createStage();
    const state = visibleState();

    stage.scene.render(state);
    state.hover[SHOWN_EDITION].tiltX = CHANGED_VALUE;
    stage.scene.render(state);
    state.light.xVw = CHANGED_VALUE;
    stage.scene.render(state);

    expect(stage.renderer.render).toHaveBeenCalledTimes(
      RENDERS_AFTER_TWO_CHANGES,
    );
  });

  it("esconde o livro quando o hover o escurece por completo", async () => {
    const stage = await createStage();
    const state = visibleState();
    state.hover[SHOWN_EDITION].dim = FULL_DIM;

    stage.scene.render(state);

    expect(bookOf(stage, SHOWN_EDITION).mesh.visible).toBe(false);
  });

  it("esconde o livro quando a opacidade fica abaixo do mínimo visível", async () => {
    const stage = await createStage();
    const state = visibleState();
    state.books[SHOWN_EDITION].opacity = NEARLY_TRANSPARENT_OPACITY;

    stage.scene.render(state);

    expect(bookOf(stage, SHOWN_EDITION).mesh.visible).toBe(false);
  });

  it("aplica a opacidade combinada com o dim aos materiais do livro", async () => {
    const stage = await createStage();
    const state = visibleState();
    state.hover[SHOWN_EDITION].dim = HALF_DIM;

    stage.scene.render(state);

    const { mesh } = bookOf(stage, SHOWN_EDITION);
    expect(mesh.visible).toBe(true);
    for (const material of materialsOf(mesh)) {
      expect(material.opacity).toBe(HALF_DIMMED_OPACITY);
    }
  });

  it("mostra o reflexo apenas com o livro visível e reflect ativo", async () => {
    const stage = await createStage();
    const state = visibleState();

    stage.scene.render(state);
    expect(bookOf(stage, SHOWN_EDITION).reflection.visible).toBe(true);

    state.books[SHOWN_EDITION].reflect = NO_REFLECT;
    stage.scene.render(state);
    expect(bookOf(stage, SHOWN_EDITION).reflection.visible).toBe(false);
  });

  it("esconde o reflexo quando o livro está invisível mesmo com reflect alto", async () => {
    const stage = await createStage();
    const state = visibleState();

    stage.scene.render(state);
    state.hover[SHOWN_EDITION].dim = FULL_DIM;
    stage.scene.render(state);

    const book = bookOf(stage, SHOWN_EDITION);
    expect(book.mesh.visible).toBe(false);
    expect(book.reflection.visible).toBe(false);
  });

  it("posiciona e escala o livro combinando pose, grow e lift do hover", async () => {
    const stage = await createStage();
    const state = visibleState();
    Object.assign(state.books[SHOWN_EDITION], {
      xVw: MOVED_X_VW,
      yVh: POSE_Y_VH,
      zPx: POSE_Z_PX,
      scale: POSE_SCALE,
    });
    Object.assign(state.hover[SHOWN_EDITION], {
      grow: HOVER_GROW,
      liftVh: HOVER_LIFT_VH,
    });

    stage.scene.render(state);

    const restScale = VIEWPORT.bookWidth * POSE_SCALE;
    const scale = restScale * GROWN_SIZE_RATIO;
    const restFloor =
      (-POSE_Y_VH * VIEWPORT.vh) / PERCENT -
      BOOK_PROPORTION.height * restScale * HALF;
    const lift = (HOVER_LIFT_VH * VIEWPORT.vh) / PERCENT;
    const { mesh } = bookOf(stage, SHOWN_EDITION);
    expect(mesh.scale.x).toBeCloseTo(scale);
    expect(mesh.scale.y).toBeCloseTo(scale);
    expect(mesh.scale.z).toBeCloseTo(scale);
    expect(mesh.position.x).toBeCloseTo((MOVED_X_VW * VIEWPORT.vw) / PERCENT);
    expect(mesh.position.y - BOOK_PROPORTION.height * scale * HALF).toBeCloseTo(
      restFloor + lift,
    );
    expect(mesh.position.z).toBe(POSE_Z_PX);
  });

  it("ao redimensionar recalcula a câmera e reposiciona as luzes", async () => {
    const stage = await createStage();
    stage.scene.render(visibleState());
    const { camera } = lastRender(stage);
    const { key, fill } = lightsOf(stage);
    const keyBefore = key.position.clone();
    const fillBefore = fill.position.clone();

    stage.scene.resize(RESIZED_VIEWPORT);

    expect(
      Math.tan(MathUtils.degToRad(camera.fov) * HALF) * STAGE_PERSPECTIVE_PX,
    ).toBeCloseTo(RESIZED_VIEWPORT.height * HALF);
    expect(camera.aspect).toBe(
      RESIZED_VIEWPORT.width / RESIZED_VIEWPORT.height,
    );
    expect(stage.renderer.setSize).toHaveBeenLastCalledWith(
      RESIZED_VIEWPORT.width,
      RESIZED_VIEWPORT.height,
      false,
    );
    expect(stage.renderer.setPixelRatio).toHaveBeenLastCalledWith(
      RESIZED_VIEWPORT.pixelRatio,
    );
    for (const [light, before] of [
      [key, keyBefore],
      [fill, fillBefore],
    ] as const) {
      expect(light.position.x).toBeCloseTo(before.x * RESIZE_FACTOR);
      expect(light.position.y).toBeCloseTo(before.y * RESIZE_FACTOR);
      expect(light.position.z).toBe(before.z);
    }
  });

  it("renderiza de novo após redimensionar mesmo sem mudança de estado", async () => {
    const stage = await createStage();
    const state = visibleState();

    stage.scene.render(state);
    stage.scene.resize(RESIZED_VIEWPORT);
    stage.scene.render(state);

    expect(stage.renderer.render).toHaveBeenCalledTimes(RENDERS_AFTER_RESIZE);
  });

  it("dispose libera geometria, texturas e materiais e remove o canvas", async () => {
    const stage = await createStage();
    stage.scene.render(visibleState());
    const meshes = editions.flatMap(({ id }) => {
      const book = bookOf(stage, id);
      return [book.mesh, book.reflection];
    });
    const materials = meshes.flatMap(materialsOf);
    const textures = textureSets.flatMap((set) => Object.values(set));
    const disposables: { dispose: () => void }[] = [
      geometry,
      fadeTextureOf(materials),
      ...textures,
      ...materials,
    ];
    const spies = disposables.map((item) => vi.spyOn(item, "dispose"));

    stage.scene.dispose();

    for (const spy of spies) {
      expect(spy).toHaveBeenCalledOnce();
    }
    expect(stage.renderer.dispose).toHaveBeenCalledOnce();
    expect(stage.renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(stage.host.contains(stage.renderer.domElement)).toBe(false);
  });

  it("descarta o renderer e rejeita quando as texturas falham", async () => {
    mocks.createBookTextures.mockRejectedValue(new Error(TEXTURE_FAILURE));
    const host = document.createElement("div");

    await expect(createBookScene(host, VIEWPORT)).rejects.toThrow(
      TEXTURE_FAILURE,
    );

    const renderer = lastRenderer();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(host.childElementCount).toBe(0);
    expect(mocks.createBookGeometry).not.toHaveBeenCalled();
  });
});
