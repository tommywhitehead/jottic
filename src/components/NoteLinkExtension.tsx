import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Plugin key for the note link extension
const noteLinkPluginKey = new PluginKey('noteLink');

// Custom note link extension
export const NoteLinkExtension = Extension.create({
  name: 'noteLink',

  addOptions() {
    return {
      onLinkCreated: null as ((noteName: string) => void) | null,
    };
  },

  addProseMirrorPlugins() {
    const { onLinkCreated } = this.options;
    let previousLinks = new Set<string>();
    let hasUserInteracted = false;

    return [
      new Plugin({
        key: noteLinkPluginKey,
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const doc = state.doc;
            const noteLinkRegex = /\/[a-zA-Z0-9-_]+\//g;
            const currentLinks = new Set<string>();

            doc.descendants((node, pos) => {
              if (node.isText) {
                const text = node.text;
                let match;

                while ((match = noteLinkRegex.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = pos + match.index + match[0].length;
                  const noteName = match[0].slice(1, -1); // Remove leading and trailing slashes
                  
                  // Track this link
                  currentLinks.add(noteName);

                  // Create decoration for the note link
                  const decoration = Decoration.inline(from, to, {
                    class: 'note-link',
                    'data-note-name': noteName,
                  });

                  decorations.push(decoration);
                }
              }
            });

            // Check for new links and trigger navigation (only after user has interacted)
            if (onLinkCreated && hasUserInteracted) {
              currentLinks.forEach(noteName => {
                if (!previousLinks.has(noteName)) {
                  // This is a new link created by user typing, trigger navigation
                  setTimeout(() => onLinkCreated(noteName), 0);
                }
              });
            }

            // Update previous links for next comparison
            previousLinks = new Set(currentLinks);

            return DecorationSet.create(doc, decorations);
          },
          handleKeyDown: () => {
            // Mark that user has started interacting
            hasUserInteracted = true;
            return false;
          },
          handleInput: () => {
            // Mark that user has started interacting
            hasUserInteracted = true;
            return false;
          },
        },
      }),
    ];
  },
});

