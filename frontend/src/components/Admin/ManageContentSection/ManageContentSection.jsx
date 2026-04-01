import { useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";
import "./ManageContentSection.css";

const teachers = ["Professor Sofia Rodrigues", "Professor Tiago Almeida", "Professor Mariana Costa", "Professor Rui Fernandes"];

const mockEntriesByGroup = {
  courses: [
    {
      id: "course-1",
      title: "Beginner",
      level: "A1-A2",
      duration: "12 weeks",
      hours: 48,
      location: "Gaia",
      model: "Group",
      startDate: "2026-04-08",
      endDate: "2026-06-30",
      maxStudents: 12,
      description: "Start your Portuguese journey with practical classes focused on everyday communication.",
      learning: "Build confidence with daily conversation, grammar essentials, and listening practice.",
      teacher: "Professor Sofia Rodrigues",
    },
    {
      id: "course-2",
      title: "Business Portuguese",
      level: "A2-B2",
      duration: "10 weeks",
      hours: 40,
      location: "Online",
      model: "Group",
      startDate: "2026-05-06",
      endDate: "2026-07-15",
      maxStudents: 10,
      description: "Learn professional vocabulary and communication for workplace situations.",
      learning: "Develop confidence in meetings, emails, and workplace conversations in Portuguese.",
      teacher: "Professor Tiago Almeida",
    },
  ],
  "fun-facts": [
    {
      id: "fact-1",
      title: "Coffee in Portugal Is Usually Called Bica",
      category: "Culture",
      imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
      excerpt: "If you ask for coffee in many cafes, locals often order a bica.",
      content: "Bica is a short espresso-like coffee and an important part of Portuguese daily life.",
    },
    {
      id: "fact-2",
      title: "Portuguese Is Spoken Across Multiple Continents",
      category: "Language",
      imageUrl: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&w=1200&q=80",
      excerpt: "Portuguese is an official language in several countries.",
      content: "Portuguese has global presence across Europe, South America, Africa, and Asia.",
    },
  ],
  "hour-packages": [
    {
      id: "package-1",
      name: "Starter Pack",
      hours: 10,
      price: 290,
      validFor: "3 months",
      format: "Individual",
      notes: "Best for new students exploring private classes.",
    },
    {
      id: "package-2",
      name: "Pro Pack",
      hours: 30,
      price: 780,
      validFor: "6 months",
      format: "Individual",
      notes: "Most popular for consistent progress.",
    },
  ],
  comments: [
    {
      id: "comment-1",
      author: "Ana Costa",
      rating: 5,
      status: "Published",
      comment: "Great teachers and practical classes.",
    },
    {
      id: "comment-2",
      author: "Miguel Ferreira",
      rating: 4,
      status: "Pending",
      comment: "Very good content and organization.",
    },
  ],
  enrollments: [
    {
      id: "enrollment-1",
      studentName: "Sofia Mendes",
      course: "Business Portuguese",
      startDate: "2026-03-01",
      status: "Pending",
      paymentStatus: "Unpaid",
      notes: "Waiting for payment confirmation.",
    },
    {
      id: "enrollment-2",
      studentName: "Daniel Ribeiro",
      course: "Advanced C1-C2",
      startDate: "2025-10-10",
      status: "Completed",
      paymentStatus: "Paid",
      notes: "Completed successfully.",
    },
  ],
  "homepage-content": [
    {
      id: "home-1",
      sectionName: "Hero",
      title: "Learn Portuguese with Confidence",
      subtitle: "Achieve your goals",
      ctaLabel: "Get Started",
      ctaLink: "/register",
      notes: "Homepage first fold content.",
    },
    {
      id: "home-2",
      sectionName: "Testimonials",
      title: "What Our Students Say",
      subtitle: "Real feedback from learners",
      ctaLabel: "Read More",
      ctaLink: "/fun-facts",
      notes: "Section title and CTA text.",
    },
  ],
};

export default function ManageContentSection() {
  const [activeModal, setActiveModal] = useState(null);
  const [selectedEntryByGroup, setSelectedEntryByGroup] = useState({});
  const [courseEditStep, setCourseEditStep] = useState("form");
  const [courseEditPickId, setCourseEditPickId] = useState("");

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
        id: "hour-packages",
        title: "Hour Packages",
        description: "Control package names, hours, and payment values.",
      },
      {
        id: "comments",
        title: "Comments",
        description: "Moderate testimonials and public website comments.",
      },
      {
        id: "enrollments",
        title: "Enrollments",
        description: "Track and update enrollment records and statuses.",
      },
    ],
    // TODO: ADD PROFESSOR
    [],
  );

  const activeGroup = activeModal ? contentGroups.find((group) => group.id === activeModal.groupId) : null;
  const activeEntries = activeGroup ? (mockEntriesByGroup[activeGroup.id] ?? []) : [];
  const selectedEntryId = activeGroup ? (selectedEntryByGroup[activeGroup.id] ?? activeEntries[0]?.id ?? "") : "";
  const selectedEntry = activeEntries.find((entry) => entry.id === selectedEntryId);

  const closeModal = () => {
    setActiveModal(null);
    setCourseEditStep("form");
    setCourseEditPickId("");
  };

  const openModal = (groupId, action) => {
    setSelectedEntryByGroup((current) => {
      if (current[groupId]) {
        return current;
      }

      const fallbackId = (mockEntriesByGroup[groupId] ?? [])[0]?.id;
      return fallbackId ? { ...current, [groupId]: fallbackId } : current;
    });

    if (groupId === "courses" && action === "edit") {
      setCourseEditStep("select");
      setCourseEditPickId("");
    } else {
      setCourseEditStep("form");
      setCourseEditPickId("");
    }

    setActiveModal({ groupId, action });
  };

  const isEditMode = activeModal?.action === "edit";
  const isCourseEditSelection = isEditMode && activeGroup?.id === "courses" && courseEditStep === "select";

  const renderCourseForm = () => {
    const draftCourse = selectedEntry ?? {
      title: "",
      level: "",
      duration: "",
      hours: 0,
      location: "",
      model: "Group",
      startDate: "",
      endDate: "",
      maxStudents: 0,
      description: "",
      learning: "",
      teacher: "",
    };

    return (
      <>
        <div className="admin-content-form-section-title">Basic Information</div>
        <div className="admin-content-form-grid two-columns">
          <div>
            <label htmlFor="admin-course-title">Course title</label>
            <input id="admin-course-title" type="text" defaultValue={draftCourse.title} />
          </div>
          <div>
            <label htmlFor="admin-course-level">Level</label>
            <input id="admin-course-level" type="text" defaultValue={draftCourse.level} />
          </div>
          <div>
            <label htmlFor="admin-course-duration">Duration</label>
            <input id="admin-course-duration" type="text" defaultValue={draftCourse.duration} />
          </div>
          <div>
            <label htmlFor="admin-course-hours">Hours</label>
            <input id="admin-course-hours" type="number" defaultValue={draftCourse.hours} />
          </div>
          <div>
            <label htmlFor="admin-course-location">Location</label>
            <input id="admin-course-location" type="text" defaultValue={draftCourse.location} />
          </div>
          <div>
            <label htmlFor="admin-course-model">Model</label>
            <select id="admin-course-model" defaultValue={draftCourse.model}>
              <option>Group</option>
              <option>Individual</option>
            </select>
          </div>
          <div>
            <label htmlFor="admin-course-start">Start date</label>
            <input id="admin-course-start" type="date" defaultValue={draftCourse.startDate} />
          </div>
          <div>
            <label htmlFor="admin-course-end">End date</label>
            <input id="admin-course-end" type="date" defaultValue={draftCourse.endDate} />
          </div>
          <div>
            <label htmlFor="admin-course-max-students">Max students</label>
            <input id="admin-course-max-students" type="number" defaultValue={draftCourse.maxStudents} />
          </div>
        </div>

        <div className="admin-content-form-section-title">Course Details</div>
        <div className="admin-content-form-grid">
          <div>
            <label htmlFor="admin-course-description">Description</label>
            <textarea id="admin-course-description" rows="3" defaultValue={draftCourse.description} />
          </div>
          <div>
            <label htmlFor="admin-course-learning">What you'll learn</label>
            <textarea id="admin-course-learning" rows="3" defaultValue={draftCourse.learning} />
          </div>
          <div>
            <label htmlFor="admin-course-teacher">Teacher</label>
            <select id="admin-course-teacher" defaultValue={draftCourse.teacher}>
              {teachers.map((teacherName) => (
                <option key={teacherName} value={teacherName}>
                  {teacherName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    );
  };

  const renderGenericForm = () => {
    if (!activeGroup) {
      return null;
    }

    const fallbackEntry = activeEntries[0] ?? {};
    const draft = selectedEntry ?? fallbackEntry;

    if (activeGroup.id === "fun-facts") {
      return (
        <>
          {isEditMode ? (
            <>
              <label htmlFor="admin-fact-picker">Select fun fact</label>
              <select id="admin-fact-picker" value={selectedEntryId} onChange={(event) => setSelectedEntryByGroup((current) => ({ ...current, "fun-facts": event.target.value }))}>
                {activeEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <div className="admin-content-form-grid two-columns">
            <div>
              <label htmlFor="admin-fact-title">Title</label>
              <input id="admin-fact-title" type="text" defaultValue={draft.title} />
            </div>
            <div>
              <label htmlFor="admin-fact-category">Category</label>
              <select id="admin-fact-category" defaultValue={draft.category ?? "Language"}>
                <option>Language</option>
                <option>Culture</option>
                <option>History</option>
              </select>
            </div>
            <div className="span-two-columns">
              <label htmlFor="admin-fact-image">Image URL</label>
              <input id="admin-fact-image" type="text" defaultValue={draft.imageUrl} />
            </div>
            <div className="span-two-columns">
              <label htmlFor="admin-fact-excerpt">Excerpt</label>
              <textarea id="admin-fact-excerpt" rows="2" defaultValue={draft.excerpt} />
            </div>
            <div className="span-two-columns">
              <label htmlFor="admin-fact-content">Fact content</label>
              <textarea id="admin-fact-content" rows="4" defaultValue={draft.content} />
            </div>
          </div>
        </>
      );
    }

    if (activeGroup.id === "hour-packages") {
      return (
        <>
          {isEditMode ? (
            <>
              <label htmlFor="admin-package-picker">Select package</label>
              <select id="admin-package-picker" value={selectedEntryId} onChange={(event) => setSelectedEntryByGroup((current) => ({ ...current, "hour-packages": event.target.value }))}>
                {activeEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <div className="admin-content-form-grid two-columns">
            <div>
              <label htmlFor="admin-package-name">Package name</label>
              <input id="admin-package-name" type="text" defaultValue={draft.name} />
            </div>
            <div>
              <label htmlFor="admin-package-format">Format</label>
              <select id="admin-package-format" defaultValue={draft.format ?? "Individual"}>
                <option>Individual</option>
                <option>Group</option>
              </select>
            </div>
            <div>
              <label htmlFor="admin-package-hours">Total hours</label>
              <input id="admin-package-hours" type="number" defaultValue={draft.hours} />
            </div>
            <div>
              <label htmlFor="admin-package-price">Price (EUR)</label>
              <input id="admin-package-price" type="number" defaultValue={draft.price} />
            </div>
            <div>
              <label htmlFor="admin-package-validity">Valid for</label>
              <input id="admin-package-validity" type="text" defaultValue={draft.validFor} />
            </div>
            <div className="span-two-columns">
              <label htmlFor="admin-package-notes">Notes</label>
              <textarea id="admin-package-notes" rows="3" defaultValue={draft.notes} />
            </div>
          </div>
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

    if (activeGroup.id === "courses") {
      return renderCourseForm();
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

            <h3>{isCourseEditSelection ? "Select Course" : `${isEditMode ? "Edit" : "Create"} ${activeGroup?.title}`}</h3>
            <p>{isCourseEditSelection ? "Choose one course first, then confirm to continue to the edit screen." : "This is a UI prototype for future backend integration. The same popup pattern can be connected to API requests later."}</p>

            {renderModalBody()}

            <div className="admin-content-modal-actions">
              <button type="button" className="admin-content-modal-cancel" onClick={closeModal}>
                Cancel
              </button>
              {isCourseEditSelection ? (
                <button
                  type="button"
                  className="admin-content-modal-confirm"
                  onClick={() => {
                    if (!courseEditPickId) {
                      return;
                    }

                    setSelectedEntryByGroup((current) => ({ ...current, courses: courseEditPickId }));
                    setCourseEditStep("form");
                  }}
                  disabled={!courseEditPickId}
                >
                  Confirm
                </button>
              ) : null}
              {isEditMode && !isCourseEditSelection ? (
                <button type="button" className="admin-content-modal-delete" onClick={closeModal}>
                  Delete
                </button>
              ) : null}
              {!isCourseEditSelection ? (
                <button type="button" className="admin-content-modal-confirm" onClick={closeModal}>
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
