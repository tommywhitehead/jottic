import React from 'react';
import { TiptapEditor } from './TiptapEditor';

export function TiptapDemo() {
  const sampleContent = `
<h1>Welcome to Tiptap Editor</h1>

<p>This is a <strong>collaborative text editor</strong> powered by <em>Tiptap</em> and <code>Liveblocks</code>.</p>

<h2>Features</h2>

<ul>
  <li>Real-time collaboration</li>
  <li>Rich text formatting</li>
  <li>Live cursors and selections</li>
  <li>Multiple heading levels</li>
  <li>Code blocks and inline code</li>
  <li>Lists and blockquotes</li>
</ul>

<h3>Try it out!</h3>

<p>You can use the toolbar that appears when you hover over the editor, or use keyboard shortcuts:</p>

<blockquote>
  <p><strong>Bold:</strong> Cmd/Ctrl + B</p>
  <p><strong>Italic:</strong> Cmd/Ctrl + I</p>
  <p><strong>Code:</strong> Cmd/Ctrl + E</p>
</blockquote>

<pre><code>// Code blocks are great for examples
function hello() {
  console.log("Hello, Tiptap!");
}</code></pre>

<hr>

<p>Start typing to see the magic happen! ✨</p>
  `.trim();

  return (
    <div className="tiptap-demo">
      <TiptapEditor
        documentTitle="demo"
        initialContent={sampleContent}
        onTypingChange={() => {}}
      />
    </div>
  );
}
