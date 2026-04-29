import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import CourseForm from "./Forms/CourseForm";
import HourPackageForm from "./Forms/HourPackageForm";
import FunFactForm from "./Forms/FunFactForm";
import FunFactTagForm from "./Forms/FunFactTagForm";
import CommentForm from "./Forms/CommentForm";

import "./ManageContentSection.css";

export default function ManageContentSection() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [activeModal, setActiveModal] = useState(null);
  const [selectedEntryByGroup, setSelectedEntryByGroup] = useState({});
  const [courseEditStep, setCourseEditStep] = useState("form");
  const [courseEditPickId, setCourseEditPickId] = useState("");
  const [funFactEditStep, setFunFactEditStep] = useState("form");
  const [funFactEditPickId, setFunFactEditPickId] = useState("");
  const [hourPackageEditStep, setHourPackageEditStep] = useState("form");
  const [hourPackageEditPickId, setHourPackageEditPickId] = useState("");
  const [commentEditStep, setCommentEditStep] = useState("form");
  const [commentEditPickId, setCommentEditPickId] = useState("");
  const [courses, setCourses] = useState([]);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [isCourseSaving, setIsCourseSaving] = useState(false);
  const [courseFeedback, setCourseFeedback] = useState("");
  const [funFactTags, setFunFactTags] = useState([]);
  const [isFunFactTagLoading, setIsFunFactTagLoading] = useState(false);
  const [isFunFactTagSaving, setIsFunFactTagSaving] = useState(false);
  const [funFactTagFeedback, setFunFactTagFeedback] = useState("");
  const [funFacts, setFunFacts] = useState([]);
  const [isFunFactLoading, setIsFunFactLoading] = useState(false);
  const [isFunFactSaving, setIsFunFactSaving] = useState(false);
  const [funFactFeedback, setFunFactFeedback] = useState("");
  const [hourPackages, setHourPackages] = useState([]);
  const [isHourPackageLoading, setIsHourPackageLoading] = useState(false);
  const [isHourPackageSaving, setIsHourPackageSaving] = useState(false);
  const [hourPackageFeedback, setHourPackageFeedback] = useState("");
  const [comments, setComments] = useState([]);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState("");

  const loadCourses = useCallback(async () => {
    setIsCourseLoading(true);
    setCourseFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}/courses`);
      if (!response.ok) {
        throw new Error("Unable to load courses");
      }

      const data = await response.json();
      const sortedCourses = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
          })
        : [];

      setCourses(sortedCourses);
    } catch {
      setCourseFeedback("Could not load courses from the API.");
    } finally {
      setIsCourseLoading(false);
    }
  }, [apiBaseUrl]);

  const loadFunFactTags = useCallback(async () => {
    setIsFunFactTagLoading(true);
    setFunFactTagFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}/fun-fact-tags`);
      if (!response.ok) {
        throw new Error("Unable to load fun fact tags");
      }

      const tags = await response.json();
      setFunFactTags(Array.isArray(tags) ? tags : []);
    } catch {
      setFunFactTagFeedback("Could not load fun fact tags from the API.");
    } finally {
      setIsFunFactTagLoading(false);
    }
  }, [apiBaseUrl]);

  const loadFunFacts = useCallback(async () => {
    setIsFunFactLoading(true);
    setFunFactFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}/fun-facts`);
      if (!response.ok) {
        throw new Error("Unable to load fun facts");
      }

      const facts = await response.json();
      const sortedFacts = Array.isArray(facts)
        ? [...facts].sort((a, b) => {
            const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
          })
        : [];
      setFunFacts(sortedFacts);
    } catch {
      setFunFactFeedback("Could not load fun facts from the API.");
    } finally {
      setIsFunFactLoading(false);
    }
  }, [apiBaseUrl]);

  const loadHourPackages = useCallback(async () => {
    setIsHourPackageLoading(true);
    setHourPackageFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}/hour-packages`);
      if (!response.ok) {
        throw new Error("Unable to load hour packages");
      }

      const packages = await response.json();
      const sortedPackages = Array.isArray(packages)
        ? [...packages].sort((a, b) => {
            const aPopular = a?.is_popular ? 1 : 0;
            const bPopular = b?.is_popular ? 1 : 0;
            if (aPopular !== bPopular) {
              return bPopular - aPopular;
            }

            const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
          })
        : [];
      setHourPackages(sortedPackages);
    } catch {
      setHourPackageFeedback("Could not load hour packages from the API.");
    } finally {
      setIsHourPackageLoading(false);
    }
  }, [apiBaseUrl]);

  const loadComments = useCallback(async () => {
    setIsCommentLoading(true);
    setCommentFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}/comments`);
      if (!response.ok) {
        throw new Error("Unable to load comments");
      }

      const data = await response.json();
      const sortedComments = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
          })
        : [];
      setComments(sortedComments);
    } catch {
      setCommentFeedback("Could not load comments from the API.");
    } finally {
      setIsCommentLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadCourses();
    loadFunFactTags();
    loadFunFacts();
    loadHourPackages();
    loadComments();
  }, [loadComments, loadCourses, loadFunFactTags, loadFunFacts, loadHourPackages]);

  const contentGroups = useMemo(
    () => [
      {
        id: "courses",
        title: "Courses",
        description: "Manage titles, levels, schedules, and pricing details.",
      },
      {
        id: "fun-facts",
        title: "Fun Facts",
        description: "Maintain educational facts and associated categories.",
      },
      {
        id: "fun-fact-tags",
        title: "Fun Fact Tags",
        description: "Create and edit categories used to classify fun facts.",
      },
      {
        id: "hour-packages",
        title: "Hour Packages",
        description: "Control package names, hours, pricing, and popularity.",
      },
      {
        id: "comments",
        title: "Comments",
        description: "Moderate testimonials and public website comments.",
      },
    ],
    [],
  );

  const activeGroup = activeModal ? contentGroups.find((group) => group.id === activeModal.groupId) : null;
  const activeEntries = activeGroup ? (activeGroup.id === "courses" ? courses : activeGroup.id === "fun-fact-tags" ? funFactTags : activeGroup.id === "fun-facts" ? funFacts : activeGroup.id === "hour-packages" ? hourPackages : activeGroup.id === "comments" ? comments : []) : [];
  const selectedEntryId = activeGroup ? String(selectedEntryByGroup[activeGroup.id] ?? activeEntries[0]?.id ?? "") : "";
  const selectedEntry = activeEntries.find((entry) => String(entry.id) === selectedEntryId);

  const closeModal = () => {
    setActiveModal(null);
    setCourseEditStep("form");
    setCourseEditPickId("");
    setFunFactEditStep("form");
    setFunFactEditPickId("");
    setHourPackageEditStep("form");
    setHourPackageEditPickId("");
    setCommentEditStep("form");
    setCommentEditPickId("");
  };

  const openModal = (groupId, action) => {
    setCourseFeedback("");
    setFunFactTagFeedback("");
    setFunFactFeedback("");
    setHourPackageFeedback("");

    setSelectedEntryByGroup((current) => {
      if (current[groupId]) {
        return current;
      }

      const fallbackEntries = groupId === "courses" ? courses : groupId === "fun-fact-tags" ? funFactTags : groupId === "fun-facts" ? funFacts : groupId === "hour-packages" ? hourPackages : groupId === "comments" ? comments : [];
      const fallbackId = fallbackEntries[0]?.id;
      return fallbackId ? { ...current, [groupId]: fallbackId } : current;
    });

    if (groupId === "courses" && action === "edit") {
      setCourseEditStep("select");
      setCourseEditPickId("");
    } else if (groupId === "fun-facts" && action === "edit") {
      setFunFactEditStep("select");
      setFunFactEditPickId("");
    } else if (groupId === "hour-packages" && action === "edit") {
      setHourPackageEditStep("select");
      setHourPackageEditPickId("");
    } else if (groupId === "comments" && action === "edit") {
      setCommentEditStep("select");
      setCommentEditPickId("");
    } else {
      setCourseEditStep("form");
      setCourseEditPickId("");
      setFunFactEditStep("form");
      setFunFactEditPickId("");
      setHourPackageEditStep("form");
      setHourPackageEditPickId("");
      setCommentEditStep("form");
      setCommentEditPickId("");
    }

    setActiveModal({ groupId, action });
  };

  const handleCourseSubmit = async (payload) => {
    if (!activeGroup || activeGroup.id !== "courses") {
      closeModal();
      return;
    }

    const isEditingCourse = activeModal?.action === "edit";
    if (isEditingCourse && !selectedEntryId) {
      setCourseFeedback("Select a course to edit first.");
      return;
    }

    setIsCourseSaving(true);
    setCourseFeedback("");

    try {
      const url = isEditingCourse ? `${apiBaseUrl}/courses/${selectedEntryId}` : `${apiBaseUrl}/courses`;
      const method = isEditingCourse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.detail || "Unable to save course");
      }

      await loadCourses();
      closeModal();
    } catch (error) {
      setCourseFeedback(error?.message || "Unable to save course.");
    } finally {
      setIsCourseSaving(false);
    }
  };

  const handleSave = async () => {
    if (!activeGroup || activeGroup.id !== "fun-fact-tags") {
      closeModal();
      return;
    }

    const name = document.getElementById("admin-fun-fact-tag-name")?.value?.trim() ?? "";
    if (!name) {
      setFunFactTagFeedback("Tag name is required.");
      return;
    }

    setIsFunFactTagSaving(true);
    setFunFactTagFeedback("");

    try {
      const url = isEditMode ? `${apiBaseUrl}/fun-fact-tags/${selectedEntryId}` : `${apiBaseUrl}/fun-fact-tags`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.detail || "Unable to save fun fact tag");
      }

      await loadFunFactTags();
      closeModal();
    } catch (error) {
      setFunFactTagFeedback(error?.message || "Unable to save fun fact tag.");
    } finally {
      setIsFunFactTagSaving(false);
    }
  };

  const handleFunFactSubmit = async (payload) => {
    if (!activeGroup || activeGroup.id !== "fun-facts") {
      closeModal();
      return;
    }

    setIsFunFactSaving(true);
    setFunFactFeedback("");

    try {
      const url = isEditMode ? `${apiBaseUrl}/fun-facts/${selectedEntryId}` : `${apiBaseUrl}/fun-facts`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.detail || "Unable to save fun fact");
      }

      await loadFunFacts();
      closeModal();
    } catch (error) {
      setFunFactFeedback(error?.message || "Unable to save fun fact.");
    } finally {
      setIsFunFactSaving(false);
    }
  };

  const handleHourPackageSubmit = async (payload) => {
    if (!activeGroup || activeGroup.id !== "hour-packages") {
      closeModal();
      return;
    }

    setIsHourPackageSaving(true);
    setHourPackageFeedback("");

    try {
      const url = isEditMode ? `${apiBaseUrl}/hour-packages/${selectedEntryId}` : `${apiBaseUrl}/hour-packages`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.detail || "Unable to save hour package");
      }

      await loadHourPackages();
      closeModal();
    } catch (error) {
      setHourPackageFeedback(error?.message || "Unable to save hour package.");
    } finally {
      setIsHourPackageSaving(false);
    }
  };

  const handleCommentSubmit = async (payload) => {
    if (!activeGroup || activeGroup.id !== "comments") {
      closeModal();
      return;
    }

    setIsCommentSaving(true);
    setCommentFeedback("");

    try {
      const url = isEditMode ? `${apiBaseUrl}/comments/${selectedEntryId}` : `${apiBaseUrl}/comments`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.detail || "Unable to save comment");
      }

      await loadComments();
      closeModal();
    } catch (error) {
      setCommentFeedback(error?.message || "Unable to save comment.");
    } finally {
      setIsCommentSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeGroup || !selectedEntryId) {
      closeModal();
      return;
    }

    if (activeGroup.id === "courses") {
      setIsCourseSaving(true);
      setCourseFeedback("");

      try {
        const response = await fetch(`${apiBaseUrl}/courses/${selectedEntryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody?.detail || "Unable to delete course");
        }

        await loadCourses();
        setSelectedEntryByGroup((current) => ({
          ...current,
          courses: "",
        }));
        closeModal();
      } catch (error) {
        setCourseFeedback(error?.message || "Unable to delete course.");
      } finally {
        setIsCourseSaving(false);
      }

      return;
    }

    if (activeGroup.id === "fun-facts") {
      setIsFunFactSaving(true);
      setFunFactFeedback("");

      try {
        const response = await fetch(`${apiBaseUrl}/fun-facts/${selectedEntryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody?.detail || "Unable to delete fun fact");
        }

        await loadFunFacts();
        setSelectedEntryByGroup((current) => ({
          ...current,
          "fun-facts": "",
        }));
        closeModal();
      } catch (error) {
        setFunFactFeedback(error?.message || "Unable to delete fun fact.");
      } finally {
        setIsFunFactSaving(false);
      }

      return;
    }

    if (activeGroup.id === "hour-packages") {
      setIsHourPackageSaving(true);
      setHourPackageFeedback("");

      try {
        const response = await fetch(`${apiBaseUrl}/hour-packages/${selectedEntryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody?.detail || "Unable to delete hour package");
        }

        await loadHourPackages();
        setSelectedEntryByGroup((current) => ({
          ...current,
          "hour-packages": "",
        }));
        closeModal();
      } catch (error) {
        setHourPackageFeedback(error?.message || "Unable to delete hour package.");
      } finally {
        setIsHourPackageSaving(false);
      }

      return;
    }

    if (activeGroup.id === "comments") {
      setIsCommentSaving(true);
      setCommentFeedback("");

      try {
        const response = await fetch(`${apiBaseUrl}/comments/${selectedEntryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody?.detail || "Unable to delete comment");
        }

        await loadComments();
        setSelectedEntryByGroup((current) => ({
          ...current,
          comments: "",
        }));
        closeModal();
      } catch (error) {
        setCommentFeedback(error?.message || "Unable to delete comment.");
      } finally {
        setIsCommentSaving(false);
      }

      return;
    }

    if (activeGroup.id !== "fun-fact-tags") {
      closeModal();
      return;
    }

    setIsFunFactTagSaving(true);
    setFunFactTagFeedback("");

    try {
      const response = await fetch(`${apiBaseUrl}/fun-fact-tags/${selectedEntryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.detail || "Unable to delete fun fact tag");
      }

      await loadFunFactTags();
      setSelectedEntryByGroup((current) => ({
        ...current,
        "fun-fact-tags": "",
      }));
      closeModal();
    } catch (error) {
      setFunFactTagFeedback(error?.message || "Unable to delete fun fact tag.");
    } finally {
      setIsFunFactTagSaving(false);
    }
  };

  const isEditMode = activeModal?.action === "edit";
  const isCourseEditSelection = isEditMode && activeGroup?.id === "courses" && courseEditStep === "select";
  const isFunFactEditSelection = isEditMode && activeGroup?.id === "fun-facts" && funFactEditStep === "select";
  const isHourPackageEditSelection = isEditMode && activeGroup?.id === "hour-packages" && hourPackageEditStep === "select";
  const isCommentEditSelection = isEditMode && activeGroup?.id === "comments" && commentEditStep === "select";
  const isSelectionStep = isCourseEditSelection || isFunFactEditSelection || isHourPackageEditSelection || isCommentEditSelection;

  const renderGenericForm = () => {
    if (!activeGroup) {
      return null;
    }

    const fallbackEntry = activeEntries[0] ?? {};
    const draft = selectedEntry ?? fallbackEntry;

    if (activeGroup.id === "fun-facts") {
      return <>{isFunFactLoading ? <p>Loading fun facts...</p> : <FunFactForm fact={isEditMode ? selectedEntry : null} onSubmit={handleFunFactSubmit} apiBaseUrl={apiBaseUrl} />}</>;
    }

    if (activeGroup.id === "fun-fact-tags") {
      if (isFunFactTagLoading) {
        return <p>Loading tags...</p>;
      }

      return (
        <>
          {isEditMode ? (
            <>
              <label htmlFor="admin-fun-fact-tag-picker">Select tag</label>
              <select id="admin-fun-fact-tag-picker" value={selectedEntryId} onChange={(event) => setSelectedEntryByGroup((current) => ({ ...current, "fun-fact-tags": Number(event.target.value) }))}>
                {activeEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <FunFactTagForm tag={isEditMode ? selectedEntry : null} />
        </>
      );
    }

    if (activeGroup.id === "comments") {
      return (
        <>
          {isEditMode ? (
            <>
              <label htmlFor="admin-comment-picker">Select comment</label>
              <select id="admin-comment-picker" value={selectedEntryId} onChange={(event) => setSelectedEntryByGroup((current) => ({ ...current, comments: event.target.value }))}>
                {activeEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.author}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <div className="admin-content-form-grid two-columns">
            <div>
              <label htmlFor="admin-comment-author">Author</label>
              <input id="admin-comment-author" type="text" defaultValue={draft.author} />
            </div>
            <div>
              <label htmlFor="admin-comment-rating">Rating</label>
              <input id="admin-comment-rating" type="number" min="1" max="5" defaultValue={draft.rating ?? 5} />
            </div>
            <div>
              <label htmlFor="admin-comment-status">Status</label>
              <select id="admin-comment-status" defaultValue={draft.status ?? "Pending"}>
                <option>Pending</option>
                <option>Published</option>
                <option>Hidden</option>
              </select>
            </div>
            <div className="span-two-columns">
              <label htmlFor="admin-comment-body">Comment text</label>
              <textarea id="admin-comment-body" rows="4" defaultValue={draft.comment} />
            </div>
          </div>
        </>
      );
    }

    if (activeGroup.id === "enrollments") {
      return (
        <>
          {isEditMode ? (
            <>
              <label htmlFor="admin-enrollment-picker">Select enrollment</label>
              <select id="admin-enrollment-picker" value={selectedEntryId} onChange={(event) => setSelectedEntryByGroup((current) => ({ ...current, enrollments: event.target.value }))}>
                {activeEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.studentName}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <div className="admin-content-form-grid two-columns">
            <div>
              <label htmlFor="admin-enrollment-student">Student name</label>
              <input id="admin-enrollment-student" type="text" defaultValue={draft.studentName} />
            </div>
            <div>
              <label htmlFor="admin-enrollment-course">Course</label>
              <input id="admin-enrollment-course" type="text" defaultValue={draft.course} />
            </div>
            <div>
              <label htmlFor="admin-enrollment-start">Start date</label>
              <input id="admin-enrollment-start" type="date" defaultValue={draft.startDate} />
            </div>
            <div>
              <label htmlFor="admin-enrollment-status">Status</label>
              <select id="admin-enrollment-status" defaultValue={draft.status ?? "Pending"}>
                <option>Pending</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Canceled</option>
              </select>
            </div>
            <div>
              <label htmlFor="admin-enrollment-payment">Payment status</label>
              <select id="admin-enrollment-payment" defaultValue={draft.paymentStatus ?? "Unpaid"}>
                <option>Unpaid</option>
                <option>Paid</option>
                <option>Refunded</option>
              </select>
            </div>
            <div className="span-two-columns">
              <label htmlFor="admin-enrollment-notes">Notes</label>
              <textarea id="admin-enrollment-notes" rows="3" defaultValue={draft.notes} />
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        {isEditMode ? (
          <>
            <label htmlFor="admin-homepage-picker">Select content block</label>
            <select id="admin-homepage-picker" value={selectedEntryId} onChange={(event) => setSelectedEntryByGroup((current) => ({ ...current, "homepage-content": event.target.value }))}>
              {activeEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.sectionName}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <div className="admin-content-form-grid two-columns">
          <div>
            <label htmlFor="admin-homepage-section">Section name</label>
            <input id="admin-homepage-section" type="text" defaultValue={draft.sectionName} />
          </div>
          <div>
            <label htmlFor="admin-homepage-title">Title</label>
            <input id="admin-homepage-title" type="text" defaultValue={draft.title} />
          </div>
          <div>
            <label htmlFor="admin-homepage-subtitle">Subtitle</label>
            <input id="admin-homepage-subtitle" type="text" defaultValue={draft.subtitle} />
          </div>
          <div>
            <label htmlFor="admin-homepage-cta-label">CTA label</label>
            <input id="admin-homepage-cta-label" type="text" defaultValue={draft.ctaLabel} />
          </div>
          <div className="span-two-columns">
            <label htmlFor="admin-homepage-cta-link">CTA link</label>
            <input id="admin-homepage-cta-link" type="text" defaultValue={draft.ctaLink} />
          </div>
          <div className="span-two-columns">
            <label htmlFor="admin-homepage-notes">Notes</label>
            <textarea id="admin-homepage-notes" rows="3" defaultValue={draft.notes} />
          </div>
        </div>
      </>
    );
  };

  const renderModalBody = () => {
    if (!activeGroup) {
      return null;
    }

    if (isCourseEditSelection) {
      if (isCourseLoading) {
        return <p>Loading courses...</p>;
      }

      if (courseFeedback) {
        return <p className="admin-content-form-error">{courseFeedback}</p>;
      }

      if (activeEntries.length === 0) {
        return <p>No courses found. Please create one first.</p>;
      }

      return (
        <div className="admin-course-picker-buttons" role="listbox" aria-label="Select course to edit">
          {activeEntries.map((entry) => (
            <button key={entry.id} type="button" className={`admin-course-picker-button ${courseEditPickId === entry.id ? "is-selected" : ""}`} onClick={() => setCourseEditPickId(entry.id)}>
              <span>{entry.title}</span>
              <span>{entry.level}</span>
            </button>
          ))}
        </div>
      );
    }

    if (isFunFactEditSelection) {
      return (
        <div className="admin-course-picker-buttons" role="listbox" aria-label="Select fun fact to edit">
          {activeEntries.map((entry) => (
            <button key={entry.id} type="button" className={`admin-course-picker-button ${funFactEditPickId === entry.id ? "is-selected" : ""}`} onClick={() => setFunFactEditPickId(entry.id)}>
              <span>{entry.title}</span>
              <span>{entry.created_at ? new Date(entry.created_at).toLocaleString() : "No date"}</span>
            </button>
          ))}
        </div>
      );
    }

    if (isHourPackageEditSelection) {
      if (isHourPackageLoading) {
        return <p>Loading hour packages...</p>;
      }

      if (hourPackageFeedback) {
        return <p className="admin-content-form-error">{hourPackageFeedback}</p>;
      }

      if (activeEntries.length === 0) {
        return <p>No hour packages found. Please create one first.</p>;
      }

      return (
        <div className="admin-course-picker-buttons" role="listbox" aria-label="Select hour package to edit">
          {activeEntries.map((entry) => (
            <button key={entry.id} type="button" className={`admin-course-picker-button ${hourPackageEditPickId === entry.id ? "is-selected" : ""}`} onClick={() => setHourPackageEditPickId(entry.id)}>
              <span>{entry.name}</span>
              <span>{entry.hours} hours</span>
            </button>
          ))}
        </div>
      );
    }

    if (isCommentEditSelection) {
      if (isCommentLoading) {
        return <p>Loading comments...</p>;
      }

      if (activeEntries.length === 0) {
        return <p>No comments found. Please create one first.</p>;
      }

      return (
        <div className="admin-course-picker-buttons" role="listbox" aria-label="Select comment to edit">
          {activeEntries.map((entry) => (
            <button key={entry.id} type="button" className={`admin-course-picker-button ${commentEditPickId === entry.id ? "is-selected" : ""}`} onClick={() => setCommentEditPickId(entry.id)}>
              <span>{entry.author}</span>
              <span>{entry.status}</span>
            </button>
          ))}
        </div>
      );
    }

    if (activeGroup.id === "courses") {
      if (isCourseLoading) {
        return <p>Loading courses...</p>;
      }

      if (isEditMode && activeEntries.length === 0) {
        return <p>No courses found. Please create one first.</p>;
      }

      return <CourseForm course={isEditMode ? selectedEntry : null} onSubmit={handleCourseSubmit} apiBaseUrl={apiBaseUrl} />;
    }

    if (activeGroup.id === "hour-packages") {
      if (isHourPackageEditSelection && isHourPackageLoading) {
        return <p>Loading hour packages...</p>;
      }

      return <HourPackageForm hourPackage={isEditMode ? selectedEntry : null} onSubmit={handleHourPackageSubmit} />;
    }

    if (activeGroup.id === "comments") {
      if (isCommentLoading) {
        return <p>Loading comments...</p>;
      }

      if (isEditMode && activeEntries.length === 0) {
        return <p>No comments found. Please create one first.</p>;
      }

      return <CommentForm comment={isEditMode ? selectedEntry : null} onSubmit={handleCommentSubmit} />;
    }

    return renderGenericForm();
  };

  return (
    <section className="admin-manage-content-section">
      <div className="admin-manage-content-header">
        <h2>Manage Content</h2>
      </div>

      <div className="admin-manage-content-grid">
        {contentGroups.map((group) => (
          <article key={group.id} className="admin-manage-content-card">
            <h3>{group.title}</h3>
            <p>{group.description}</p>
            <div className="admin-manage-content-actions">
              <button type="button" onClick={() => openModal(group.id, "create")}>
                Create
              </button>
              <button type="button" onClick={() => openModal(group.id, "edit")}>
                Edit
              </button>
            </div>
          </article>
        ))}
      </div>

      {activeModal ? (
        <div className="admin-content-modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="admin-content-modal" role="dialog" aria-modal="true" aria-label={`${isEditMode ? "Edit" : "Create"} ${activeGroup?.title ?? "Content"}`} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="admin-content-modal-close" onClick={closeModal} aria-label="Close modal">
              <X size={18} aria-hidden="true" />
            </button>

            <h3>{isSelectionStep ? `Select ${activeGroup?.title?.replace(/s$/, "") ?? "Item"}` : `${isEditMode ? "Edit" : "Create"} ${activeGroup?.title}`}</h3>
            <p>{isSelectionStep ? "Choose one item first, then confirm to continue to the edit screen." : "Fill out the information fields."}</p>

            {activeGroup?.id === "fun-fact-tags" && funFactTagFeedback ? <p className="admin-content-modal-feedback">{funFactTagFeedback}</p> : null}
            {activeGroup?.id === "courses" && courseFeedback ? <p className="admin-content-modal-feedback">{courseFeedback}</p> : null}
            {activeGroup?.id === "fun-facts" && funFactFeedback ? <p className="admin-content-modal-feedback">{funFactFeedback}</p> : null}
            {activeGroup?.id === "hour-packages" && hourPackageFeedback ? <p className="admin-content-modal-feedback">{hourPackageFeedback}</p> : null}
            {activeGroup?.id === "comments" && commentFeedback ? <p className="admin-content-modal-feedback">{commentFeedback}</p> : null}

            {renderModalBody()}

            <div className="admin-content-modal-actions">
              <button type="button" className="admin-content-modal-cancel" onClick={closeModal}>
                Cancel
              </button>
              {isSelectionStep ? (
                <button
                  type="button"
                  className="admin-content-modal-confirm"
                  onClick={() => {
                    if (isCourseEditSelection) {
                      if (!courseEditPickId) {
                        return;
                      }

                      setSelectedEntryByGroup((current) => ({ ...current, courses: courseEditPickId }));
                      setCourseEditStep("form");
                      return;
                    }

                    if (isFunFactEditSelection) {
                      if (!funFactEditPickId) {
                        return;
                      }

                      setSelectedEntryByGroup((current) => ({ ...current, "fun-facts": funFactEditPickId }));
                      setFunFactEditStep("form");
                      return;
                    }

                    if (isHourPackageEditSelection) {
                      if (!hourPackageEditPickId) {
                        return;
                      }

                      setSelectedEntryByGroup((current) => ({ ...current, "hour-packages": hourPackageEditPickId }));
                      setHourPackageEditStep("form");
                      return;
                    }

                    if (isCommentEditSelection) {
                      if (!commentEditPickId) {
                        return;
                      }

                      setSelectedEntryByGroup((current) => ({ ...current, comments: commentEditPickId }));
                      setCommentEditStep("form");
                    }
                  }}
                  disabled={isCourseEditSelection ? !courseEditPickId : isFunFactEditSelection ? !funFactEditPickId : isHourPackageEditSelection ? !hourPackageEditPickId : isCommentEditSelection ? !commentEditPickId : false}
                >
                  Confirm
                </button>
              ) : null}
              {isEditMode && !isSelectionStep ? (
                <button type="button" className="admin-content-modal-delete" onClick={activeGroup?.id === "fun-fact-tags" || activeGroup?.id === "courses" || activeGroup?.id === "fun-facts" || activeGroup?.id === "hour-packages" || activeGroup?.id === "comments" ? handleDelete : closeModal} disabled={activeGroup?.id === "fun-fact-tags" ? isFunFactTagSaving : activeGroup?.id === "courses" ? isCourseSaving : activeGroup?.id === "fun-facts" ? isFunFactSaving : activeGroup?.id === "hour-packages" ? isHourPackageSaving : activeGroup?.id === "comments" ? isCommentSaving : false}>
                  Delete
                </button>
              ) : null}
              {!isSelectionStep ? (
                <button type={activeGroup?.id === "courses" || activeGroup?.id === "fun-facts" || activeGroup?.id === "hour-packages" || activeGroup?.id === "comments" ? "submit" : "button"} form={activeGroup?.id === "courses" ? "admin-course-form" : activeGroup?.id === "fun-facts" ? "admin-fun-fact-form" : activeGroup?.id === "hour-packages" ? "admin-hour-package-form" : activeGroup?.id === "comments" ? "admin-comment-form" : undefined} className="admin-content-modal-confirm" onClick={activeGroup?.id === "fun-fact-tags" ? handleSave : activeGroup?.id === "courses" || activeGroup?.id === "fun-facts" || activeGroup?.id === "hour-packages" || activeGroup?.id === "comments" ? undefined : closeModal} disabled={activeGroup?.id === "fun-fact-tags" ? isFunFactTagSaving : activeGroup?.id === "courses" ? isCourseSaving : activeGroup?.id === "fun-facts" ? isFunFactSaving : activeGroup?.id === "hour-packages" ? isHourPackageSaving : activeGroup?.id === "comments" ? isCommentSaving : false}>
                  {isEditMode ? "Save" : "Create"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
