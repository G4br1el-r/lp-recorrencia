import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperiencePanel } from "@/components/ui/ExperiencePanel";
import { experiences } from "@/lib/content/experiences";

const [item] = experiences;

function renderPanel(active: boolean) {
  const { container } = render(
    <ul>
      <ExperiencePanel active={active} item={item} />
    </ul>,
  );
  const find = (selector: string) => {
    const element = container.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Elemento ${selector} ausente`);
    }
    return element;
  };
  return {
    image: find("[data-panel-image]"),
    dim: find("[data-panel-dim]"),
    detail: find("[data-panel-detail]"),
  };
}

describe("ExperiencePanel", () => {
  it("destaca o painel ativo com zoom, sem escurecer e com o detalhe à mostra", () => {
    const { image, dim, detail } = renderPanel(true);

    expect(image.style.transform).toBe("scale(1.05)");
    expect(dim.style.opacity).toBe("0");
    expect(detail.style.transform).toBe("translateY(0%)");
  });

  it("recolhe o painel inativo sem zoom, escurecido e com o detalhe oculto", () => {
    const { image, dim, detail } = renderPanel(false);

    expect(image.style.transform).toBe("scale(1)");
    expect(dim.style.opacity).toBe("0.55");
    expect(detail.style.transform).toBe("translateY(100%)");
  });

  it("anima só transform e opacity por transição CSS", () => {
    const { image, dim, detail } = renderPanel(true);

    expect(image.style.transition).toContain("transform");
    expect(dim.style.transition).toContain("opacity");
    expect(detail.style.transition).toContain("transform");
  });
});
