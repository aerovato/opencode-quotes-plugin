/** @jsxImportSource @opentui/solid */

import type {
  TuiPlugin,
  TuiPluginModule,
} from "@opencode-ai/plugin/tui";
import { createMemo, createSignal } from "solid-js";

import { type QuoteSource, loadCustomQuotes, getQuotesForSource, parseQuoteInput, saveCustomQuote, removeCustomQuote } from "./utils";
import { View, SOURCE_LABELS } from "./ui";

const tui: TuiPlugin = async api => {
  api.plugins.deactivate("internal:home-tips");

  const initialQuotes = await loadCustomQuotes(api.state.path.config);
  const [customQuotes, setCustomQuotes] = createSignal(initialQuotes);

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
    {
      title: "Add quote",
      description: "Add a custom quote",
      value: "quotes.add",
      category: "System",
      hidden: api.route.current.name !== "home",
      onSelect() {
        api.ui.dialog.replace(() =>
          api.ui.DialogPrompt({
            title: "Add quote",
            placeholder: '"Your quote here" - Author Name',
            async onConfirm(input) {
              const parsed = parseQuoteInput(input);
              if (!parsed) {
                api.ui.toast({
                  variant: "error",
                  message: 'Invalid format. Use: "quote" - author',
                });
                api.ui.dialog.clear();
                return;
              }
              const ok = await saveCustomQuote(api.state.path.config, parsed);
              if (!ok) {
                api.ui.toast({
                  variant: "error",
                  message: "Failed to save quote.",
                });
                api.ui.dialog.clear();
                return;
              }
              setCustomQuotes(prev => [...prev, parsed]);
              api.ui.toast({
                variant: "success",
                message: "Quote added.",
              });
              api.ui.dialog.clear();
            },
          }),
        );
      },
    },
    {
      title: "Remove quote",
      description: "Remove a custom quote",
      value: "quotes.remove",
      category: "System",
      hidden: api.route.current.name !== "home",
      onSelect() {
        const quotes = customQuotes();
        if (quotes.length === 0) {
          api.ui.dialog.replace(() => (
            <api.ui.Dialog onClose={() => api.ui.dialog.clear()}>
              <box paddingLeft={4} paddingRight={4} paddingTop={1} paddingBottom={1}>
                <text fg={api.theme.current.textMuted}>No custom quotes added.</text>
              </box>
            </api.ui.Dialog>
          ));
          return;
        }
        api.ui.dialog.replace(() =>
          api.ui.DialogSelect({
            title: "Remove quote",
            placeholder: "Search quotes...",
            options: quotes.map(q => ({
              title: q.quote,
              description: q.author,
              value: q,
            })),
            async onSelect(option) {
              const ok = await removeCustomQuote(api.state.path.config, option.value);
              if (!ok) {
                api.ui.toast({
                  variant: "error",
                  message: "Failed to remove quote.",
                });
                api.ui.dialog.clear();
                return;
              }
              setCustomQuotes(prev => prev.filter(q => q.quote !== option.value.quote || q.author !== option.value.author));
              api.ui.toast({
                variant: "success",
                message: "Quote removed.",
              });
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
          getQuotesForSource(source(), customQuotes()),
        );
        return <View show={show()} theme={api.theme.current} quotes={quotes()} />;
      },
    },
  });
};

const isDev = !import.meta.url.includes("node_modules");

export default { id: isDev ? "opencode-quotes-plugin-test" : "opencode-quotes-plugin", tui } satisfies TuiPluginModule;
