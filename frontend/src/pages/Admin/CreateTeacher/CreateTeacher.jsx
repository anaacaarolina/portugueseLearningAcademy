import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateTeacher() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        course: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/teachers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("SERVER ERROR:", text);
                throw new Error("Failed to create teacher");
            }
            navigate("/admin-dashboard");

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Create Teacher</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Name</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Email</label>
                    <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Course</label>
                    <input
                        name="course"
                        value={form.course}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit">
                    Create Teacher
                </button>
            </form>
        </div>
    );
}