import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateStudent() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        course: "",
        status: "Active",
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        await fetch("/api/students", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        navigate("/admin-dashboard");
    };

    return (
        <div>
            <h1>Create Student</h1>

            <form onSubmit={handleSubmit}>
                <input name="name" placeholder="Name" onChange={handleChange} required />
                <input name="email" placeholder="Email" onChange={handleChange} required />
                <input name="phone" placeholder="Phone" onChange={handleChange} required />
                <select
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                >
                    <option value="">Select course</option>
                    <option value="Beginner A1-A2">Beginner A1-A2</option>
                    <option value="Intermediate B1">Intermediate B1</option>
                    <option value="Business Portuguese">Business Portuguese</option>
                </select>

                <select name="status" onChange={handleChange}>
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Completed</option>
                    <option>Canceled</option>
                </select>

                <button type="submit">Create</button>
            </form>
        </div>
    );
}
