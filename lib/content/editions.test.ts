import { describe, expect, it } from "vitest";
import {
  DEFAULT_EDITION_ID,
  type EditionId,
  editions,
  getEdition,
} from "@/lib/content/editions";

const VALID_EDITION_IDS: readonly EditionId[] = [
  "traditional",
  "largePrint",
  "celebration",
];

const UNKNOWN_EDITION_ID = "inexistente";

function isEditionId(value: string): value is EditionId {
  return editions.some((edition) => edition.id === value);
}

function unknownEditionId(): EditionId {
  const candidate: string = UNKNOWN_EDITION_ID;
  if (isEditionId(candidate)) {
    throw new Error("O id de teste não deveria ser válido");
  }
  return candidate as EditionId;
}

describe("getEdition", () => {
  it.each(VALID_EDITION_IDS)("retorna a edição correspondente a %s", (id) => {
    const edition = getEdition(id);
    expect(edition.id).toBe(id);
    expect(edition).toBe(editions.find((item) => item.id === id));
  });

  it("retorna a edição padrão", () => {
    expect(getEdition(DEFAULT_EDITION_ID).id).toBe(DEFAULT_EDITION_ID);
  });

  it("lança erro para id desconhecido", () => {
    expect(() => getEdition(unknownEditionId())).toThrowError(
      `Edição desconhecida: ${UNKNOWN_EDITION_ID}`,
    );
  });
});
