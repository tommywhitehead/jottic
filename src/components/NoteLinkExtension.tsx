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
            // Match note links like /notename/ but exclude URLs
            const noteLinkRegex = /\/[a-zA-Z0-9-_]+\//g;
            const currentLinks = new Set<string>();

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;
                let match;

                while ((match = noteLinkRegex.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = pos + match.index + match[0].length;
                  const noteName = match[0].slice(1, -1); // Remove leading and trailing slashes
                  
                  // Check if this is part of a URL by looking at surrounding context
                  const beforeMatch = text.substring(Math.max(0, match.index - 30), match.index);
                  const afterMatch = text.substring(to, Math.min(text.length, to + 30));
                  
                  // Skip if it looks like a URL - check for common URL patterns
                  const isUrl = beforeMatch.includes('http://') || 
                               beforeMatch.includes('https://') || 
                               beforeMatch.includes('www.') ||
                               // Check for domain.com/path pattern - only if the domain is immediately before the match
                               /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/$/.test(beforeMatch + match[0]);
                  
                  if (isUrl) {
                    continue;
                  }
                  
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
        },
      }),
    ];
  },
});

