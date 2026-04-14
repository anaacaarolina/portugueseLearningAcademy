const emptyFunFactTag = {
  name: "",
};

export default function FunFactTagForm({ tag }) {
  const draftTag = {
    ...emptyFunFactTag,
    ...(tag ?? {}),
  };

  return (
    <div className="admin-content-form-grid">
      <div>
        <label htmlFor="admin-fun-fact-tag-name">Name</label>
        <input id="admin-fun-fact-tag-name" type="text" defaultValue={draftTag.name} placeholder="Ex: Language" />
      </div>
    </div>
  );
}
