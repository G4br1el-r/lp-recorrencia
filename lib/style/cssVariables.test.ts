import { describe, expect, it } from "vitest";
import { seconds } from "@/lib/style/cssVariables";

const FRACTIONAL_SECONDS = 1.4;
const WHOLE_SECONDS = 3;

describe("seconds", () => {
  it("formata valores fracionários como duração CSS", () => {
    expect(seconds(FRACTIONAL_SECONDS)).toBe("1.4s");
  });

  it("formata valores inteiros como duração CSS", () => {
    expect(seconds(WHOLE_SECONDS)).toBe("3s");
  });
});
