import { useEffect, useMemo, useState } from "react";

const emptyComment = {
  author: "",
  rating: 5,
  status: "pending",
  body: "",
};

function normalizeStatus(status) {
  const nextStatus = String(status ?? "")
    .trim()
    .toLowerCase();
  if (nextStatus === "published" || nextStatus === "hidden" || nextStatus === "pending") {
    return nextStatus;
  }

  return "pending";
}

function normalizeComment(comment) {
  return {
    ...emptyComment,
    ...(comment ?? {}),
    author: comment?.author ?? "",
    rating: comment?.rating ?? 5,
    status: normalizeStatus(comment?.status),
    body: comment?.body ?? comment?.comment ?? "",
  };
}

export default function CommentForm({ comment, onSubmit }) {
  const draftComment = useMemo(() => normalizeComment(comment), [comment]);
  const [authorValue, setAuthorValue] = useState(draftComment.author);
  const [ratingValue, setRatingValue] = useState(String(draftComment.rating));
  const [statusValue, setStatusValue] = useState(draftComment.status);
  const [bodyValue, setBodyValue] = useState(draftComment.body);

  useEffect(() => {
    setAuthorValue(draftComment.author);
    setRatingValue(String(draftComment.rating));
    setStatusValue(draftComment.status);
    setBodyValue(draftComment.body);
  }, [draftComment]);

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit?.({
      author: authorValue.trim(),
      rating: Number(ratingValue),
      status: statusValue,
      body: bodyValue.trim(),
    });
  }

  return (
    <form id="admin-comment-form" onSubmit={handleSubmit}>
      <div className="admin-content-form-grid two-columns">
        <div>
          <label htmlFor="admin-comment-author">Author</label>
          <input id="admin-comment-author" type="text" value={authorValue} required onChange={(event) => setAuthorValue(event.target.value)} placeholder="Ana Costa" />
        </div>

        <div>
          <label htmlFor="admin-comment-rating">Rating</label>
          <input id="admin-comment-rating" type="number" min="1" max="5" step="1" value={ratingValue} required onChange={(event) => setRatingValue(event.target.value)} />
        </div>

        <div>
          <label htmlFor="admin-comment-status">Status</label>
          <select id="admin-comment-status" value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
            <option value="pending">Pending</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div className="span-two-columns">
          <label htmlFor="admin-comment-body">Comment text</label>
          <textarea id="admin-comment-body" rows="4" value={bodyValue} required onChange={(event) => setBodyValue(event.target.value)} placeholder="Great teachers and practical classes." />
        </div>
      </div>
    </form>
  );
}
