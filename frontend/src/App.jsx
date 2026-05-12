import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import MainLayout from "./components/MainLayout/MainLayout";
import Homepage from "./pages/public/Homepage/Homepage";
import Course from "./pages/public/Courses/Course/Course";
import Courses from "./pages/public/Courses/Courses/Courses";
import Enrollment from "./pages/public/Enrollment/Enrollment/Enrollment";
import Payment from "./pages/public/Payment/Payment/Payment";
import PaymentSuccess from "./pages/public/Payment/PaymentSuccess/PaymentSuccess";
import PaymentCancelled from "./pages/public/Payment/PaymentCancelled/PaymentCancelled";
import Login from "./pages/auth/Login/Login";
import Register from "./pages/auth/Register/Register";
import FunFact from "./pages/public/FunFacts/FunFact/FunFact";
import FunFacts from "./pages/public/FunFacts/FunFacts/FunFacts";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";
import StudentDashboard from "./pages/Student/StudentDashboard/StudentDashboard";
import StudentDetails from "./pages/Student/StudentDetails/StudentDetails";
import ProtectedRoute from "./components/Auth/ProtectedRoute/ProtectedRoute";

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTopOnRouteChange />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseSlug" element={<Course />} />
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/fun-facts" element={<FunFacts />} />
          <Route path="/fun-facts/:slug" element={<FunFact />} />

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/student-details" element={<StudentDetails />} />
            <Route path="/student-details/:id" element={<StudentDetails />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["student", "unrolled_student"]} />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
