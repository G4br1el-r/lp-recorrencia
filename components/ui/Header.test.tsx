import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Header } from "@/components/ui/Header";
import { copy } from "@/lib/content/copy";

const FIRST_MENU_LINK_LABEL = "Edições";

function renderHeader() {
  render(
    <MotionProvider>
      <main>
        <p>fora do menu</p>
      </main>
      <Header />
    </MotionProvider>,
  );
  return screen.getByRole("button", { name: copy.header.menu });
}

function openMenu() {
  const button = renderHeader();
  fireEvent.click(button);
  return button;
}

function menuNav(button: HTMLElement) {
  const menuId = button.getAttribute("aria-controls") ?? "";
  const nav = document.getElementById(menuId);
  if (!nav) {
    throw new Error("menu mobile não foi montado");
  }
  return nav;
}

describe("Header — menu mobile", () => {
  it("move o foco para o primeiro link ao abrir o menu", () => {
    const button = openMenu();
    const firstLink = menuNav(button).querySelector("a");

    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(firstLink?.textContent).toBe(FIRST_MENU_LINK_LABEL);
    expect(document.activeElement).toBe(firstLink);
  });

  it("fecha o menu ao tocar fora dele", () => {
    const button = openMenu();

    fireEvent.pointerDown(screen.getByText("fora do menu"));

    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("mantém o menu aberto ao tocar dentro dele", () => {
    const button = openMenu();
    const firstLink = menuNav(button).querySelector("a");
    if (!firstLink) {
      throw new Error("menu mobile sem links");
    }

    fireEvent.pointerDown(firstLink);

    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("não reage a toques fora enquanto o menu está fechado", () => {
    const button = renderHeader();

    fireEvent.pointerDown(screen.getByText("fora do menu"));

    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});
