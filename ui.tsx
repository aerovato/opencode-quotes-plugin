/** @jsxImportSource @opentui/solid */

import type { TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import { createMemo, For, Show } from "solid-js";
import type { Quote } from "./quotes";
import type { QuoteSource } from "./utils";
import { wordWrap } from "./utils";
import { TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/solid";

export const MAX_QUOTES_WIDTH = 66;

export const SOURCE_LABELS: Record<QuoteSource, string> = {
  builtin: "Built-in",
  custom: "Custom",
  both: "Both",
};

function Quotes(props: { theme: TuiThemeCurrent; quotes: Quote[] }) {
  const quote = props.quotes[Math.floor(Math.random() * props.quotes.length)];
  const text = quote?.quote ?? "No custom quotes configured.";
  const author = quote?.author ?? "Add a quote in ~/.config/opencode/quotes.json";

  const dimensions = useTerminalDimensions();
  const lines = createMemo(() =>
    wordWrap(text, Math.min(MAX_QUOTES_WIDTH, dimensions().width - 8)),
  );

  return (
    <box width="100%" flexDirection="column" flexShrink={0}>
      <For each={lines()}>
        {line => (
          <text alignSelf="center" style={{ fg: props.theme.text }}>
            {line}
          </text>
        )}
      </For>
      <text
        alignSelf={"center"}
        attributes={TextAttributes.ITALIC}
        style={{ fg: props.theme.warning }}
      >
        {author}
      </text>
    </box>
  );
}

export function View(props: {
  show: boolean;
  theme: TuiThemeCurrent;
  quotes: Quote[];
}) {
  return (
    <box
      minHeight={4}
      width="100%"
      maxWidth={MAX_QUOTES_WIDTH}
      alignItems="center"
      paddingY={2}
    >
      <Show when={props.show}>
        <Quotes theme={props.theme} quotes={props.quotes} />
      </Show>
    </box>
  );
}
