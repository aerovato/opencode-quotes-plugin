/** @jsxImportSource @opentui/solid */

import type { TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import type { Accessor } from "solid-js";
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

function Quotes(props: { theme: TuiThemeCurrent; quotes: Quote[]; selected: Accessor<Quote | null> }) {
  const display = createMemo(() => {
    const q = props.selected() ?? props.quotes[Math.floor(Math.random() * props.quotes.length)];
    return {
      text: q?.quote ?? "No custom quotes configured.",
      author: q?.author ?? "Add a custom quote via the `Add quote` command.",
    };
  });

  const dimensions = useTerminalDimensions();
  const lines = createMemo(() =>
    wordWrap(display().text, Math.min(MAX_QUOTES_WIDTH, dimensions().width - 8)),
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
        {display().author}
      </text>
    </box>
  );
}

export function View(props: {
  show: boolean;
  theme: TuiThemeCurrent;
  quotes: Quote[];
  selected: Accessor<Quote | null>;
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
        <Quotes theme={props.theme} quotes={props.quotes} selected={props.selected} />
      </Show>
    </box>
  );
}
