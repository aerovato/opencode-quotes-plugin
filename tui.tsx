/** @jsxImportSource @opentui/solid */

import type {
  TuiPlugin,
  TuiPluginModule,
} from "@opencode-ai/plugin/tui";
import { createMemo } from "solid-js";

import { type QuoteSource, loadCustomQuotes, getQuotesForSource } from "./utils";
import { View, SOURCE_LABELS } from "./ui";

const tui: TuiPlugin = async api => {
  api.plugins.deactivate("internal:home-tips");

  const customQuotes = await loadCustomQuotes(api.state.path.config);

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
    {
      title: "Quote source",
      description: "Specify quotes source",
      value: "quotes.source",
      category: "System",
      hidden: api.route.current.name !== "home",
      onSelect() {
        const current = api.kv.get("quote_source", "both") as QuoteSource;
        api.ui.dialog.replace(() =>
          api.ui.DialogSelect({
            title: "Quote source",
            options: (["builtin", "custom", "both"] as const).map(s => ({
              title: SOURCE_LABELS[s],
              value: s,
            })),
            current,
            onSelect(option) {
              api.kv.set("quote_source", option.value);
              api.ui.dialog.clear();
            },
          }),
        );
      },
    },
  ]);

  api.slots.register({
    order: 100,
    slots: {
      home_bottom() {
        const hidden = createMemo(() => api.kv.get("tips_hidden", false));
        const show = createMemo(() => !hidden());
        const source = createMemo(
          () => (api.kv.get("quote_source", "both") as QuoteSource),
        );
        const quotes = createMemo(() =>
          getQuotesForSource(source(), customQuotes),
        );
        return <View show={show()} theme={api.theme.current} quotes={quotes()} />;
      },
    },
  });
};

const isDev = !import.meta.url.includes("node_modules");

export default { id: isDev ? "opencode-quotes-plugin-test" : "opencode-quotes-plugin", tui } satisfies TuiPluginModule;
