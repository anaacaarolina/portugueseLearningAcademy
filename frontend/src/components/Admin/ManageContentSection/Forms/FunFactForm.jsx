import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DOMPurify from "dompurify";

const emptyFunFact = {
  title: "",
  body: "",
  keyPoints: "",
  didYouKnow: "",
  tagId: "",
  slug: "",
  imageUrl: "",
  isPublished: false,
};

function buildSlugFromTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sanitize(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "blockquote"],
    ALLOWED_ATTR: [],
  });
}

function TextField({ id, label, initialValue, onHtmlChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialValue || "<p></p>",
  });
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const next = initialValue || "<p></p>";
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next);
    }

    onHtmlChange?.(next);
  }, [editor, initialValue, onHtmlChange]);

  useEffect(() => {
    if (!editor) return undefined;

    const refreshToolbarState = () => {
      forceRender((current) => current + 1);
    };

    editor.on("selectionUpdate", refreshToolbarState);
    editor.on("transaction", refreshToolbarState);
    editor.on("focus", refreshToolbarState);
    editor.on("blur", refreshToolbarState);

    const handleEditorUpdate = () => {
      onHtmlChange?.(editor.getHTML());
    };
    editor.on("update", handleEditorUpdate);

    return () => {
      editor.off("selectionUpdate", refreshToolbarState);
      editor.off("transaction", refreshToolbarState);
      editor.off("focus", refreshToolbarState);
      editor.off("blur", refreshToolbarState);
      editor.off("update", handleEditorUpdate);
    };
  }, [editor, onHtmlChange]);
  return (
    <div className="span-two-columns">
      <label>{label}</label>

      <div className="admin-text-toolbar" role="toolbar" aria-label={`${label} formatting controls`}>
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive("bold") ? "is-active" : ""}>
          Bold
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive("italic") ? "is-active" : ""}>
          Italic
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive("bulletList") ? "is-active" : ""}>
          Bullet List
        </button>
      </div>

      <div className="admin-text-editor-wrapper">
        <EditorContent editor={editor} className="admin-text-editor" />
      </div>

      <input type="hidden" id={id} value={editor?.getHTML() ?? ""} readOnly />
    </div>
  );
}

export default function FunFactForm({ fact, onSubmit, apiBaseUrl }) {
  const draftFact = useMemo(
    () => ({
      ...emptyFunFact,
      ...(fact ?? {}),
      body: fact?.body ?? fact?.content ?? "",
      keyPoints: fact?.keyPoints ?? fact?.key_points ?? fact?.excerpt ?? "",
      didYouKnow: fact?.didYouKnow ?? fact?.did_you_know ?? "",
      tagId: fact?.tagId ?? fact?.tag_id ?? "",
      slug: fact?.slug ?? "",
      imageUrl: fact?.imageUrl ?? fact?.image_url ?? "",
      isPublished: fact?.isPublished ?? fact?.is_published ?? false,
    }),
    [fact],
  );

  const slugInputRef = useRef(null);
  const [tagOptions, setTagOptions] = useState([]);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [tagLoadError, setTagLoadError] = useState("");
  const [selectedTagId, setSelectedTagId] = useState(draftFact.tagId ? String(draftFact.tagId) : "");
  const [titleValue, setTitleValue] = useState(draftFact.title);
  const [bodyValue, setBodyValue] = useState(draftFact.body || "<p></p>");
  const [keyPointsValue, setKeyPointsValue] = useState(draftFact.keyPoints || "<p></p>");
  const [didYouKnowValue, setDidYouKnowValue] = useState(draftFact.didYouKnow);
  const [slugValue, setSlugValue] = useState(draftFact.slug || buildSlugFromTitle(draftFact.title));
  const [isSlugManual, setIsSlugManual] = useState(Boolean(draftFact.slug));

  useEffect(() => {
    setSelectedTagId(draftFact.tagId ? String(draftFact.tagId) : "");
  }, [draftFact.tagId]);

  useEffect(() => {
    setTitleValue(draftFact.title);
    setBodyValue(draftFact.body || "<p></p>");
    setKeyPointsValue(draftFact.keyPoints || "<p></p>");
    setDidYouKnowValue(draftFact.didYouKnow);
    setSlugValue(draftFact.slug || buildSlugFromTitle(draftFact.title));
    setIsSlugManual(Boolean(draftFact.slug));
  }, [draftFact]);

  useEffect(() => {
    let isMounted = true;

    const loadTags = async () => {
      setIsTagLoading(true);
      setTagLoadError("");

      try {
        const response = await fetch(`${apiBaseUrl}/fun-fact-tags`);
        if (!response.ok) {
          throw new Error("Unable to load fun fact tags");
        }

        const data = await response.json();
        if (!isMounted) {
          return;
        }

        const nextTags = Array.isArray(data) ? data : [];
        setTagOptions(nextTags);
      } catch {
        if (isMounted) {
          setTagLoadError("Could not load fun fact tags.");
        }
      } finally {
        if (isMounted) {
          setIsTagLoading(false);
        }
      }
    };

    loadTags();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!selectedTagId && tagOptions.length > 0) {
      setSelectedTagId(String(tagOptions[0].id));
    }
  }, [tagOptions, selectedTagId]);

  function handleSubmit(event) {
    event.preventDefault();

    const title = titleValue.trim();
    const rawBody = bodyValue;
    const rawKeyPoints = keyPointsValue;
    const didYouKnow = didYouKnowValue.trim();

    const payload = {
      title,
      slug: slugValue.trim(),
      tag_id: Number(selectedTagId) || null,
      body: sanitize(rawBody),
      key_points: sanitize(rawKeyPoints),
      did_you_know: didYouKnow,
      image_url: document.getElementById("admin-fact-image-url")?.value.trim() ?? "",
      is_published: document.getElementById("admin-fact-is-published")?.checked ?? false,
    };

    onSubmit?.(payload);
  }

  return (
    <form id="admin-fun-fact-form" onSubmit={handleSubmit}>
      <div className="admin-content-form-grid two-columns">
        <div className="span-two-columns">
          <label htmlFor="admin-fact-title">Title</label>
          <input
            id="admin-fact-title"
            type="text"
            value={titleValue}
            required
            onChange={(event) => {
              setTitleValue(event.target.value);
              if (!isSlugManual) {
                const autoSlug = buildSlugFromTitle(event.target.value);
                setSlugValue(autoSlug);
                if (slugInputRef.current) {
                  slugInputRef.current.value = autoSlug;
                }
              }
            }}
          />
        </div>

        <TextField id="admin-fact-body" label="Body" initialValue={draftFact.body} onHtmlChange={setBodyValue} />

        <TextField id="admin-fact-key-points" label="Key points" initialValue={draftFact.keyPoints} onHtmlChange={setKeyPointsValue} />

        <div className="span-two-columns">
          <label htmlFor="admin-fact-did-you-know">Did you know</label>
          <textarea id="admin-fact-did-you-know" rows="3" value={didYouKnowValue} onChange={(event) => setDidYouKnowValue(event.target.value)} placeholder="Single-sentence highlight." />
        </div>

        <div>
          <label htmlFor="admin-fact-tag-id">Tag</label>
          <select id="admin-fact-tag-id" value={selectedTagId} onChange={(event) => setSelectedTagId(event.target.value)} disabled={isTagLoading || tagOptions.length === 0} required>
            {tagOptions.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          {tagLoadError ? <p className="admin-content-modal-feedback">{tagLoadError}</p> : null}
        </div>

        <div>
          <label htmlFor="admin-fact-slug">Slug</label>
          <input
            id="admin-fact-slug"
            type="text"
            value={slugValue}
            placeholder="Auto-generated from title, but editable."
            ref={slugInputRef}
            onChange={(event) => {
              setSlugValue(event.target.value);
              setIsSlugManual(true);
            }}
          />
        </div>

        <div className="span-two-columns">
          <label htmlFor="admin-fact-image-url">Image URL</label>
          <input id="admin-fact-image-url" type="text" defaultValue={draftFact.imageUrl} />
        </div>

        <div className="span-two-columns">
          <label className="admin-content-checkbox" htmlFor="admin-fact-is-published">
            <input id="admin-fact-is-published" type="checkbox" defaultChecked={Boolean(draftFact.isPublished)} />
            <span className="admin-content-checkbox-checkmark" aria-hidden="true"></span>
            <span className="admin-content-checkbox-text">Published</span>
          </label>
        </div>
      </div>
    </form>
  );
}
