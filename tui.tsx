/** @jsxImportSource @opentui/solid */

import type { TuiPlugin, TuiPluginModule, TuiThemeCurrent } from "@opencode-ai/plugin/tui"
import { createMemo, Show } from "solid-js"

import { QUOTES } from "./quotes"

function Tips(props: { theme: TuiThemeCurrent }) {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]!;
  const split = quote.split("—"); // NOTE: Emdash; regular dashes are for names.
  const author = split.at(-1)?.trim();
  const text = split.slice(0, -1).join("—").trim();
  if (author === undefined || text === undefined) {
    throw new Error(`Error: Malformed quote ${quote}.`)
  }

  return (
    <box maxWidth="100%" flexDirection="column" paddingX={6}>
      <text alignItems="center" style={{ fg: props.theme.text }}>
        {text}
      </text>
      <text
        alignSelf={text.length < 40 ? "center" : "flex-end"}
        style={{ fg: props.theme.primary }}
      >
        - {author}
      </text>
    </box>
  )
}

function View(props: { show: boolean; theme: TuiThemeCurrent }) {
  return (
    <box minHeight={0} width="100%" maxWidth={75} alignItems="center" paddingY={2} flexShrink={1}>
      <Show when={props.show}>
        <Tips theme={props.theme} />
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.plugins.deactivate("internal:home-tips")

  api.command.register(() => [
    {
      title: api.kv.get("tips_hidden", false) ? "Show tips" : "Hide tips",
      value: "tips.toggle",
      keybind: "tips_toggle",
      category: "System",
      hidden: api.route.current.name !== "home",
      onSelect() {
        api.kv.set("tips_hidden", !api.kv.get("tips_hidden", false))
        api.ui.dialog.clear()
      },
    },
  ])

  api.slots.register({
    order: 100,
    slots: {
      home_bottom() {
        const hidden = createMemo(() => api.kv.get("tips_hidden", false))
        const show = createMemo(() => !hidden())
        return <View show={show()} theme={api.theme.current} />
      },
    },
  })
}

export default { id: "opencode-quotes-plugin", tui } satisfies TuiPluginModule
