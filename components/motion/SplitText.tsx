import type { ElementType, HTMLAttributes } from "react";
import type { CssVariables } from "@/lib/style/cssVariables";
import { splitHighlight } from "@/lib/text/splitHighlight";

function lineIndexStyle(index: number): CssVariables {
  return { "--line-index": index };
}

type SplitTextProps = HTMLAttributes<HTMLElement> & {
  lines: readonly string[];
  as?: ElementType;
  lineClassName?: string;
  innerClassName?: string;
  highlight?: string;
  highlightClassName?: string;
};

export function SplitText({
  lines,
  as: Tag = "p",
  className,
  lineClassName,
  innerClassName,
  highlight,
  highlightClassName,
  ...rest
}: SplitTextProps) {
  return (
    <Tag className={className} {...rest}>
      {lines.map((line, index) => (
        <span
          className={["mask-line", lineClassName].filter(Boolean).join(" ")}
          key={line}
          style={lineIndexStyle(index)}
        >
          <span className={innerClassName} data-split-line="">
            {splitHighlight(line, highlight).map((part) =>
              part.highlighted ? (
                <span className={highlightClassName} key={part.start}>
                  {part.text}
                </span>
              ) : (
                part.text
              ),
            )}
          </span>
        </span>
      ))}
    </Tag>
  );
}
