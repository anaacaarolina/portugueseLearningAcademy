import "./AdminDashboard.css";
import { BookOpen, Euro, Target, Users } from "lucide-react";
import KpiCard from "../../../components/Admin/KpiCard/KpiCard";
import ManageContentSection from "../../../components/Admin/ManageContentSection/ManageContentSection";
import StudentsTable from "../../../components/Admin/StudentsTable/StudentsTable";

const kpis = [
  {
    id: 1,
    icon: Users,
    value: "128",
    title: "Active Students",
  },
  {
    id: 2,
    icon: BookOpen,
    value: "9",
    title: "Total Courses",
  },
  {
    id: 3,
    icon: Target,
    value: "87%",
    title: "Completion Rate",
  },
  {
    id: 4,
    icon: Euro,
    value: "€24,300",
    title: "Total Revenue",
  },
];

const students = [
  {
    id: 1,
    name: "Ana Costa",
    email: "ana.costa@email.com",
    phone: "+351 912 345 111",
    course: "Beginner A1-A2",
    enrollmentDate: "2026-02-15",
    status: "Active",
  },
  {
    id: 2,
    name: "Miguel Ferreira",
    email: "miguel.ferreira@email.com",
    phone: "+351 915 889 002",
    course: "Intermediate B1",
    enrollmentDate: "2026-01-09",
    status: "Active",
  },
  {
    id: 3,
    name: "Sofia Mendes",
    email: "sofia.mendes@email.com",
    phone: "+351 936 778 210",
    course: "Business Portuguese",
    enrollmentDate: "2026-03-01",
    status: "Pending",
  },
  {
    id: 4,
    name: "Daniel Ribeiro",
    email: "daniel.ribeiro@email.com",
    phone: "+351 968 111 993",
    course: "Advanced C1-C2",
    enrollmentDate: "2025-10-10",
    status: "Completed",
  },
  {
    id: 5,
    name: "Carolina Rocha",
    email: "carolina.rocha@email.com",
    phone: "+351 934 554 187",
    course: "Beginner A2",
    enrollmentDate: "2026-02-28",
    status: "Canceled",
  },
];

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard-page">
      <section className="admin-dashboard-hero-section">
        <h1>Admin Dashboard</h1>
      </section>

      <section className="admin-kpis-section">
        <div className="admin-kpis-grid">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.id} icon={kpi.icon} value={kpi.value} title={kpi.title} />
          ))}
        </div>
      </section>

      <section className="admin-students-wrapper-section">
        <StudentsTable students={students} />
      </section>

      <section className="admin-manage-wrapper-section">
        <ManageContentSection />
      </section>
    </div>
  );
}
