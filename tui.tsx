/** @jsxImportSource @opentui/solid */

import type {
  TuiPlugin,
  TuiPluginModule,
  TuiThemeCurrent,
} from "@opencode-ai/plugin/tui";
import { createMemo, For, Show } from "solid-js";

import { QUOTES } from "./quotes";
import { TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/solid";

const MAX_QUOTES_WIDTH = 66;

function wordWrap(text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  if (words.length === 0) {
    return [];
  }
  const totalLen = text.length;
  const targetCharsPerLine = Math.ceil(
    totalLen / Math.ceil(totalLen / maxWidth),
  );
  const lines: string[] = [];
  let wordIndex = 0;
  let accumulatedWidth = 0;

  while (wordIndex < words.length) {
    let capacity = Math.min(
      targetCharsPerLine + accumulatedWidth + (wordIndex === 0 ? 4 : 0),
      maxWidth,
    );
    let line = words[wordIndex]!;
    wordIndex++;
    while (wordIndex < words.length) {
      const test = line + " " + words[wordIndex]!;
      if (test.length <= capacity) {
        line = test;
        wordIndex++;
      } else {
        break;
      }
    }
    lines.push(line);
    accumulatedWidth = capacity - line.length;
  }

  return lines;
}

function Quotes(props: { theme: TuiThemeCurrent }) {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]!;
  const split = quote.split("—");
  const author = split.at(-1)?.trim() || "";
  const text = split.slice(0, -1).join("—").trim();

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
        style={{ fg: props.theme.warning }}
      >
        <em>- {author}</em>
      </text>
    </box>
  );
}

function View(props: { show: boolean; theme: TuiThemeCurrent }) {
  return (
    <box
      minHeight={4}
      width="100%"
      maxWidth={MAX_QUOTES_WIDTH}
      alignItems="center"
      paddingY={2}
    >
      <Show when={props.show}>
        <Quotes theme={props.theme} />
      </Show>
    </box>
  );
}

const tui: TuiPlugin = async api => {
  api.plugins.deactivate("internal:home-tips");

  api.command.register(() => [
    {
      title: api.kv.get("tips_hidden", false) ? "Show tips" : "Hide tips",
      value: "tips.toggle",
      keybind: "tips_toggle",
      category: "System",
      hidden: api.route.current.name !== "home",
      onSelect() {
        api.kv.set("tips_hidden", !api.kv.get("tips_hidden", false));
        api.ui.dialog.clear();
      },
    },
  ]);

  api.slots.register({
    order: 100,
    slots: {
      home_bottom() {
        const hidden = createMemo(() => api.kv.get("tips_hidden", false));
        const show = createMemo(() => !hidden());
        return <View show={show()} theme={api.theme.current} />;
      },
    },
  });
};

export default { id: "opencode-quotes-plugin", tui } satisfies TuiPluginModule;
