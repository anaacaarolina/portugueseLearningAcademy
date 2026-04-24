import "./TeacherForm.css";
import { useEffect, useMemo, useState } from "react";

const emptyTeacher = {
  name: "",
  email: "",
  bio: "",
  photo_url: "",
};

function normalizeTeacher(teacher) {
  return {
    ...emptyTeacher,
    ...(teacher ?? {}),
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    bio: teacher?.bio ?? "",
    photo_url: teacher?.photo_url ?? teacher?.photoUrl ?? "",
  };
}

export default function TeacherForm({ teacher, onSubmit, apiBaseUrl }) {
  const draftTeacher = useMemo(() => normalizeTeacher(teacher), [teacher]);
  const [nameValue, setNameValue] = useState(draftTeacher.name);
  const [emailValue, setEmailValue] = useState(draftTeacher.email);
  const [bioValue, setBioValue] = useState(draftTeacher.bio);
  const [photoUrlValue, setPhotoUrlValue] = useState(draftTeacher.photo_url);

  useEffect(() => {
    setNameValue(draftTeacher.name);
    setEmailValue(draftTeacher.email);
    setBioValue(draftTeacher.bio);
    setPhotoUrlValue(draftTeacher.photo_url);
  }, [draftTeacher]);

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: nameValue.trim(),
      email: emailValue.trim(),
      bio: bioValue.trim() || null,
      photo_url: photoUrlValue.trim() || null,
    };

    onSubmit?.(payload);
  }

  return (
    <form id="admin-teacher-form" onSubmit={handleSubmit}>
      <div className="admin-content-form-grid two-columns">
        <div className="span-two-columns">
          <label htmlFor="admin-teacher-name">Name</label>
          <input id="admin-teacher-name" type="text" value={nameValue} required onChange={(event) => setNameValue(event.target.value)} />
        </div>

        <div className="span-two-columns">
          <label htmlFor="admin-teacher-email">Email</label>
          <input id="admin-teacher-email" type="email" value={emailValue} required onChange={(event) => setEmailValue(event.target.value)} />
        </div>

        <div className="span-two-columns">
          <label htmlFor="admin-teacher-bio">Bio</label>
          <textarea id="admin-teacher-bio" rows="4" value={bioValue} onChange={(event) => setBioValue(event.target.value)} placeholder="Brief biography or background" />
        </div>

        <div className="span-two-columns">
          <label htmlFor="admin-teacher-photo-url">Photo URL</label>
          <input id="admin-teacher-photo-url" type="text" value={photoUrlValue} onChange={(event) => setPhotoUrlValue(event.target.value)} placeholder="https://example.com/photo.jpg" />
        </div>
      </div>
    </form>
  );
}
