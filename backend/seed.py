import sys
import os
from datetime import datetime, date, time, timezone, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(__file__))

import sqlalchemy as sa
from database import SessionLocal, engine, Base
from Services.auth_services import get_password_hash
from models import (
    User, Teacher, HourPackage, Course, CourseSchedule,
    Enrollment, PreEnrollment, Waitlist, Payment, HourTransfer,
    TeacherAvailability, ClassBooking, Notification, FunFactTag, FunFact, Comment,
    UserRole, CourseLevel, CourseType, CourseRegime, CourseStatus,
    DayOfWeek, EnrollmentStatus, PreEnrollmentStatus, WaitlistStatus,
    PaymentStatus, PaymentType, NotificationChannel, NotificationStatus,
    BookingStatus, CommentStatus,
)

def hash_password(plain: str) -> str:
    return get_password_hash(plain)


def ensure_schema():
    """Ensure database schema is correct by adding missing columns if needed."""
    with engine.connect() as conn:
        # Check if course column exists in teachers table
        inspector = sa.inspect(conn)
        columns = [col['name'] for col in inspector.get_columns('teachers')]
        
        if 'course' not in columns:
            print("Adding course column to teachers table...")
            conn.execute(sa.text("ALTER TABLE teachers ADD COLUMN course VARCHAR"))
            conn.commit()
            print("✓ course column added successfully")


def run():
    # Ensure schema is up to date before seeding
    ensure_schema()
    
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        
         # ------------------------------------------------------------------ #
        # 1. FUN FACT TAGS
        # ------------------------------------------------------------------ #
        print("Seeding fun_fact_tags...")
        tag_data = [
            {"name": "Culture"},
            {"name": "History"},
            {"name": "Language"},
            {"name": "Gastronomy"},
        ]
        tags = {}
        for t in tag_data:
            existing = db.query(FunFactTag).filter_by(name=t["name"]).first()
            key = t["name"].lower()
            if not existing:
                obj = FunFactTag(name=t["name"])
                db.add(obj)
                db.flush()
                tags[key] = obj
            else:
                tags[key] = existing
        db.commit()

        # ------------------------------------------------------------------ #
        # 2. TEACHERS
        # ------------------------------------------------------------------ #
        print("Seeding teachers...")
        teacher_data = [
            {
                "name": "Ana Ferreira",
                "bio": "Native speaker with 10 years of experience teaching Portuguese as a foreign language. Specialises in conversational Portuguese and business communication.",
                "photo_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
                "email": "ana.ferreira@example.com",
            },
            {
                "name": "Carlos Mendes",
                "bio": "Linguist and certified CPLE examiner. Focuses on grammar foundations for A1–B2 students.",
                "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                "email": "carlos.mendes@example.com",
            },
        ]
        teachers = {}
        for t in teacher_data:
            existing = db.query(Teacher).filter_by(email=t["email"]).first()
            if not existing:
                obj = Teacher(**t)
                db.add(obj)
                db.flush()
                teachers[t["email"]] = obj
            else:
                teachers[t["email"]] = existing
        db.commit()

        ana = teachers["ana.ferreira@example.com"]
        carlos = teachers["carlos.mendes@example.com"]

        # ------------------------------------------------------------------ #
        # 3. HOUR PACKAGES
        # ------------------------------------------------------------------ #
        print("Seeding hour_packages...")
        package_data = [
            {"name": "Trial Class",    "hours": Decimal("1.0"),  "price": Decimal("15.00"), "is_trial": True,  "is_active": True, "is_popular": False},
            {"name": "Starter Pack",   "hours": Decimal("5.0"),  "price": Decimal("60.00"), "is_trial": False, "is_active": True, "is_popular": True},
            {"name": "Standard Pack",  "hours": Decimal("10.0"), "price": Decimal("110.00"),"is_trial": False, "is_active": True, "is_popular": False},
            {"name": "Intensive Pack", "hours": Decimal("20.0"), "price": Decimal("200.00"),"is_trial": False, "is_active": True, "is_popular": False},
        ]
        packages = {}
        for p in package_data:
            existing = db.query(HourPackage).filter_by(name=p["name"]).first()
            if not existing:
                obj = HourPackage(**p)
                db.add(obj)
                db.flush()
                packages[p["name"]] = obj
            else:
                packages[p["name"]] = existing
        db.commit()

        # ------------------------------------------------------------------ #
        # 4. USERS  (1 admin + 4 students)
        # ------------------------------------------------------------------ #
        print("Seeding users...")
        now = datetime.now(timezone.utc)
        user_data = [
            {
                "full_name": "Admin User",
                "name": "Admin",
                "email": "admin@portugueseacademy.pt",
                "hashed_password": hash_password("Admin1234!"),
                "role": UserRole.admin,
                "is_active": True,
                "email_verified_at": now,
            },
            {
                "full_name": "Maria Silva",
                "name": "Maria",
                "email": "maria.silva@example.com",
                "hashed_password": hash_password("Student1234!"),
                "role": UserRole.student,
                "is_active": True,
                "email_verified_at": now,
                "phone": "+351 912 345 678",
                "city": "Porto",
                "country": "Portugal",
            },
            {
                "full_name": "Luís Costa",
                "name": "Luís",
                "email": "luis.costa@example.com",
                "hashed_password": hash_password("Student1234!"),
                "role": UserRole.student,
                "is_active": True,
                "email_verified_at": now,
                "phone": "+351 913 456 789",
                "city": "Lisboa",
                "country": "Portugal",
            },
            {
                "full_name": "Patrice Rousseau ",
                "name": "Patrice",
                "email": "patrice.rousseau@example.com",
                "hashed_password": hash_password("Student1234!"),
                "role": UserRole.student,
                "is_active": True,
                "email_verified_at": now,
                "city": "Paris",
                "country": "France",
            },
            {
                "full_name": "Liam O'Brien",
                "name": "Liam",
                "email": "liam.obrien@example.com",
                "hashed_password": hash_password("Student1234!"),
                "role": UserRole.student,
                "is_active": False,
                "email_verified_at": now,
                "city": "Philadelphia",
                "country": "United States of America",
            },
            {
                "full_name": "Anabella Mendoza",
                "name": "Anabella",
                "email": "anabella.mendoza@example.com",
                "hashed_password": hash_password("Student1234!"),
                "role": UserRole.student,
                "is_active": False,
                "email_verified_at": now,
                "city": "Caracas",
                "country": "Venezuela",
            },
        ]
        users = {}
        for u in user_data:
            existing = db.query(User).filter_by(email=u["email"]).first()
            if not existing:
                obj = User(**u)
                db.add(obj)
                db.flush()
                users[u["email"]] = obj
            else:
                users[u["email"]] = existing
        db.commit()

        maria       = users["maria.silva@example.com"]
        luis        = users["luis.costa@example.com"]
        patrice      = users["patrice.rousseau@example.com"]
        liam        = users["liam.obrien@example.com"]
        anabella    = users["anabella.mendoza@example.com"]

        # ------------------------------------------------------------------ #
        # 5. COURSES
        # ------------------------------------------------------------------ #
        print("Seeding courses...")
        course_data = [
            {
                "title": "Beginner A1 - Group Course",
                "description": "Start your Portuguese journey with practical classes focused on everyday communication.",
                "level": CourseLevel.A1,
                "type": CourseType.group,
                "start_date": date(2026, 4, 1),
                "end_date": date(2026, 7, 20),
                "total_hours": Decimal("40.0"),
                "max_students": 6,
                "regime": CourseRegime.in_person,
                "location": "Gaia",
                "teacher_id": carlos.id,
                "status": CourseStatus.full,
            },
                    

            {
                "title": "Intermediate B2 - Group Course",
                "description": "Build on your current knowledge and gain confidence in conversations and writing.",
                "level": CourseLevel.B2,
                "type": CourseType.group,
                "start_date": date(2026, 4, 1),
                "end_date": date(2026, 7, 20),
                "total_hours": Decimal("40.0"),
                "max_students": 6,
                "regime": CourseRegime.remote,
                "location": "Online via Zoom",
                "teacher_id": carlos.id,
                "status": CourseStatus.active,
            },
            
            {
                "title": "Advanced C1 - Group Course",
                "description": "Master the language with complex grammar, fluency training, and cultural context.",
                "level": CourseLevel.C1,
                "type": CourseType.group,
                "start_date": date(2026, 3, 5),
                "end_date": date(2026, 6, 30),
                "total_hours": Decimal("40.0"),
                "max_students": 6,
                "regime": CourseRegime.remote,
                "location": "Online via Zoom",
                "teacher_id": carlos.id,
                "status": CourseStatus.completed,
            },
            {
                "title": "Advanced C2 - Individual Course",
                "description": "Reach near-native confidence through advanced conversation, reading, and writing work.",
                "level": CourseLevel.C2,
                "type": CourseType.individual,
                "start_date": None,
                "end_date": None,
                "total_hours": None,
                "max_students": 1,
                "regime": CourseRegime.hybrid,
                "location": "In-person or online",
                "teacher_id": ana.id,
                "status": CourseStatus.active,
            },
            {
                "title": "Intermediate B1 - Individual Course",
                "description": "Improve fluency and vocabulary through classes adapted to your personal goals.",
                "level": CourseLevel.B1,
                "type": CourseType.individual,
                "start_date": None,
                "end_date": None,
                "total_hours": None,
                "max_students": 1,
                "regime": CourseRegime.hybrid,
                "location": "In-person or online",
                "teacher_id": ana.id,
                "status": CourseStatus.active,
            },
            {
                "title": "Beginner A1 - Individual Course",
                "description": "Personalized one-to-one guidance to start speaking Portuguese from your first classes.",
                "level": CourseLevel.A1,
                "type": CourseType.individual,
                "start_date": None,
                "end_date": None,
                "total_hours": None,
                "max_students": 1,
                "regime": CourseRegime.hybrid,
                "location": "In-person or online",
                "teacher_id": ana.id,
                "status": CourseStatus.active,
            },
            {
                "title": "Business Portuguese - Group Course",
                "description": "Learn professional vocabulary and communication for meetings, emails, and workplace situations.",
                "level": CourseLevel.Business,
                "type": CourseType.group,
                "start_date": date(2026, 5, 1),
                "end_date": date(2026,7,15),
                "total_hours": Decimal("30.0"),
                "max_students": 6,
                "regime": CourseRegime.remote,
                "location": "Online via Zoom",
                "teacher_id": carlos.id,
                "status": CourseStatus.draft,
            },
        ]
        courses = {}
        for c in course_data:
            existing = db.query(Course).filter_by(title=c["title"]).first()
            if not existing:
                obj = Course(**c)
                db.add(obj)
                db.flush()
                courses[c["title"]] = obj
            else:
                courses[c["title"]] = existing
        db.commit()

        a1_group          = courses["Beginner A1 - Group Course"]
        b2_group          = courses["Intermediate B2 - Group Course"]
        c1_group          = courses["Advanced C1 - Group Course"]
        c2_individual     = courses["Advanced C2 - Individual Course"]
        b1_individual     = courses["Intermediate B1 - Individual Course"]
        a1_individual     = courses["Beginner A1 - Individual Course"]
        business_group    = courses["Business Portuguese - Group Course"]

        # ------------------------------------------------------------------ #
        # 6. FUN FACTS
        # ------------------------------------------------------------------ #
        print("Seeding fun_facts...")
        fun_fact_data = [
            {
                "title": "Coffee in Portugal Is Usually Called Bica",
                "slug": "coffee-in-portugal-bica",
                "tag_id": tags["culture"].id,
                "body": "<p>In many Portuguese cafes, especially in Lisbon, people do not usually ask for an espresso. Instead, they ask for a <strong>bica</strong>. It is a small, strong coffee that is part of daily rhythm, from early mornings to short breaks during the afternoon.</p><p>Coffee moments in Portugal are also cultural moments. Friends meet for a quick bica before work, colleagues pause for one between tasks, and families often end meals with coffee and conversation.</p>",
                "key_points": "<ul><li>The word <em>bica</em> is commonly used in Lisbon for a small espresso-style coffee.</li><li>Coffee culture in Portugal is social and fast, often enjoyed standing at the counter.</li><li>A bica is usually stronger and shorter than the average filter coffee.</li><li>Ordering coffee like a local helps learners connect with daily language habits.</li></ul>",
                "did_you_know": "The popular saying that explains bica as an acronym for \"Beba Isto Com Açúcar\" is famous, but historians still debate if that is the true origin.",
                "image_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=80",
                "is_published": True,
            },
            {
                "title": "Portuguese Has a Unique Tense Called the Personal Infinitive",
                "slug": "personal-infinitive-portuguese",
                "tag_id": tags["language"].id,
                "body": "<p>Unlike most European languages, Portuguese has a verb form called the <strong>personal infinitive</strong>. It is an infinitive that can be conjugated by person — something that does not exist in Spanish, French, or Italian.</p><p>This tense is used in specific grammatical structures, often to add clarity about who is performing the action, especially in sentences with multiple subjects.</p>",
                "key_points": "<ul><li>The personal infinitive is unique to Portuguese among major Romance languages.</li><li>It is conjugated across all six grammatical persons.</li><li>It often replaces subordinate clauses in formal and written Portuguese.</li><li>Mastering it separates intermediate learners from advanced speakers.</li></ul>",
                "did_you_know": "Brazilian and European Portuguese use the personal infinitive in slightly different contexts, which sometimes causes confusion even between native speakers.",
                "image_url": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1400&q=80",
                "is_published": True,
            },
            {
                "title": "Fado Is a UNESCO Intangible Cultural Heritage",
                "slug": "fado-unesco-heritage",
                "tag_id": tags["culture"].id,
                "body": "<p><strong>Fado</strong> is a genre of music deeply rooted in Portuguese identity. Characterised by its melancholic tone and themes of longing — a feeling the Portuguese call <em>saudade</em> — fado was recognised by UNESCO in 2011 as an Intangible Cultural Heritage of Humanity.</p><p>Learning about fado is one of the most direct ways to understand the emotional vocabulary of the Portuguese language and culture.</p>",
                "key_points": "<ul><li>Fado was granted UNESCO Intangible Cultural Heritage status in 2011.</li><li>It is most associated with Lisbon and Coimbra, each with a distinct style.</li><li>The concept of <em>saudade</em> — a nostalgic longing — is central to fado lyrics.</li><li>Understanding fado helps learners grasp the emotional depth of the language.</li></ul>",
                "did_you_know": "Amália Rodrigues, known as the Queen of Fado, helped bring the genre to international audiences in the 20th century and remains its most iconic figure.",
                "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80",
                "is_published": True,
            },
        ]
        for f in fun_fact_data:
            existing = db.query(FunFact).filter_by(slug=f["slug"]).first()
            if not existing:
                obj = FunFact(**f)
                db.add(obj)
        db.commit()

        # ------------------------------------------------------------------ #
        # 7. COURSE SCHEDULES  (group courses)
        # ------------------------------------------------------------------ #
        print("Seeding course_schedules...")
        schedule_data = [
            {"course_id": a1_group.id, "day_of_week": DayOfWeek.Mon, "start_time": time(9, 0),  "end_time": time(10, 30)},
            {"course_id": a1_group.id, "day_of_week": DayOfWeek.Wed, "start_time": time(9, 0),  "end_time": time(10, 30)},
            # B2 group — Tue + Thu evenings
            {"course_id": b2_group.id, "day_of_week": DayOfWeek.Tue, "start_time": time(19, 0), "end_time": time(20, 30)},
            {"course_id": b2_group.id, "day_of_week": DayOfWeek.Thu, "start_time": time(19, 0), "end_time": time(20, 30)},
        ]
        for s in schedule_data:
            existing = db.query(CourseSchedule).filter_by(
                course_id=s["course_id"], day_of_week=s["day_of_week"]
            ).first()
            if not existing:
                db.add(CourseSchedule(**s))
        db.commit()

        # ------------------------------------------------------------------ #
        # 8. TEACHER AVAILABILITY  (individual course)
        # ------------------------------------------------------------------ #
        print("Seeding teacher_availability...")
        base_date = date(2025, 9, 1)
        availability_slots = []
        for week_offset in range(4):
            for day_offset, hour in [(0, 10), (2, 14), (4, 16)]: 
                slot_date = base_date + timedelta(weeks=week_offset, days=day_offset)
                availability_slots.append({
                    "teacher_id": ana.id,
                    "date": slot_date,
                    "start_time": time(hour, 0),
                    "end_time": time(hour + 1, 0),
                    "is_booked": False,
                })

        saved_slots = []
        for s in availability_slots:
            existing = db.query(TeacherAvailability).filter_by(
                teacher_id=s["teacher_id"], date=s["date"], start_time=s["start_time"]
            ).first()
            if not existing:
                obj = TeacherAvailability(**s)
                db.add(obj)
                db.flush()
                saved_slots.append(obj)
            else:
                saved_slots.append(existing)
        db.commit()

        # ------------------------------------------------------------------ #
        # 9. ENROLLMENTS
        # ------------------------------------------------------------------ #
        print("Seeding enrollments...")
        enrollment_data = [
            
            {
                "user_id": maria.id, "course_id": a1_group.id,
                "status": EnrollmentStatus.active,
                "hours_total": Decimal("10.0"), "hours_used": Decimal("3.0"),
                "enrolled_at": datetime(2025, 8, 20, tzinfo=timezone.utc),
            },
            {
                "user_id": luis.id, "course_id": b2_group.id,
                "status": EnrollmentStatus.active,
                "hours_total": Decimal("10.0"), "hours_used": Decimal("5.0"),
                "enrolled_at": datetime(2025, 8, 22, tzinfo=timezone.utc),
            },
            {
                "user_id": patrice.id, "course_id": c2_individual.id,
                "status": EnrollmentStatus.active,
                "hours_total": Decimal("15.0"), "hours_used": Decimal("7.0"),
                "enrolled_at": datetime(2025, 8, 25, tzinfo=timezone.utc),
            },
        ]
        enrollments = {}
        for e in enrollment_data:
            existing = db.query(Enrollment).filter_by(
                user_id=e["user_id"], course_id=e["course_id"]
            ).first()
            if not existing:
                obj = Enrollment(**e)
                db.add(obj)
                db.flush()
                enrollments[(e["user_id"], e["course_id"])] = obj
            else:
                enrollments[(e["user_id"], e["course_id"])] = existing
        db.commit()

        maria_enrollment  = enrollments[(maria.id,  a1_group.id)]
        luis_enrollment   = enrollments[(luis.id,   b2_group.id)]
        patrice_enrollment = enrollments[(patrice.id, c2_individual.id)]

        # ------------------------------------------------------------------ #
        # 10. PRE-ENROLLMENTS
        # ------------------------------------------------------------------ #
        print("Seeding pre_enrollments...")
        existing_pre = db.query(PreEnrollment).filter_by(
            user_id=liam.id, course_id=business_group.id
        ).first()
        if not existing_pre:
            db.add(PreEnrollment(
                user_id=liam.id,
                course_id=business_group.id,
                status=PreEnrollmentStatus.pending,
            ))
        db.commit()

        # ------------------------------------------------------------------ #
        # 11. WAITLIST
        # ------------------------------------------------------------------ #
        print("Seeding waitlist...")
        existing_wl = db.query(Waitlist).filter_by(
            user_id=anabella.id, course_id=a1_group.id
        ).first()
        if not existing_wl:
            db.add(Waitlist(
                user_id=anabella.id,
                course_id=a1_group.id,
                position=1,
                status=WaitlistStatus.waiting,
            ))
        db.commit()

        # ------------------------------------------------------------------ #
        # 12. PAYMENTS
        # ------------------------------------------------------------------ #
        print("Seeding payments...")
        standard_pack = packages["Standard Pack"]
        starter_pack  = packages["Starter Pack"]

        payment_data = [
            {
                "user_id": maria.id,
                "package_id": standard_pack.id,
                "amount": standard_pack.price,
                "status": PaymentStatus.paid,
                "type": PaymentType.package,
                "paid_at": datetime(2025, 8, 20, tzinfo=timezone.utc),
                "stripe_payment_id": "pi_seed_maria_001",
                "stripe_receipt_url": "https://pay.stripe.com/receipts/seed_maria_001",
            },
            {
                "user_id": luis.id,
                "package_id": standard_pack.id,
                "amount": standard_pack.price,
                "status": PaymentStatus.paid,
                "type": PaymentType.package,
                "paid_at": datetime(2025, 8, 22, tzinfo=timezone.utc),
                "stripe_payment_id": "pi_seed_luis_001",
                "stripe_receipt_url": "https://pay.stripe.com/receipts/seed_luis_001",
            },
            {
                "user_id": patrice.id,
                "package_id": starter_pack.id,
                "amount": starter_pack.price,
                "status": PaymentStatus.paid,
                "type": PaymentType.package,
                "paid_at": datetime(2025, 8, 25, tzinfo=timezone.utc),
                "stripe_payment_id": "pi_seed_patrice_001",
                "stripe_receipt_url": "https://pay.stripe.com/receipts/seed_patrice_001",
            },
        ]
        for p in payment_data:
            existing = db.query(Payment).filter_by(
                stripe_payment_id=p["stripe_payment_id"]
            ).first()
            if not existing:
                db.add(Payment(**p))
        db.commit()

        # ------------------------------------------------------------------ #
        # 13. CLASS BOOKINGS 
        # ------------------------------------------------------------------ #
        print("Seeding class_bookings...")
        if saved_slots:
            first_slot = saved_slots[0]
            existing_booking = db.query(ClassBooking).filter_by(
                enrollment_id=patrice_enrollment.id,
                availability_id=first_slot.id,
            ).first()
            if not existing_booking:
                db.add(ClassBooking(
                    enrollment_id=patrice_enrollment.id,
                    availability_id=first_slot.id,
                    status=BookingStatus.completed,
                    hours_deducted=Decimal("1.0"),
                    booked_at=datetime(2025, 9, 1, 10, 0, tzinfo=timezone.utc),
                ))
                first_slot.is_booked = True
                db.add(first_slot)
        db.commit()

        # ------------------------------------------------------------------ #
        # 14. HOUR TRANSFERS  
        # ------------------------------------------------------------------ #
        print("Skipping hour_transfers — none in initial seed.")

        # ------------------------------------------------------------------ #
        # 15. NOTIFICATIONS
        # ------------------------------------------------------------------ #
        print("Seeding notifications...")
        notification_data = [
            {
                "user_id": maria.id,
                "channel": NotificationChannel.email,
                "type": "enrollment_confirmation",
                "content": "You have been successfully enrolled in Portuguese A1 — Beginners Group.",
                "status": NotificationStatus.sent,
                "sent_at": datetime(2025, 8, 20, tzinfo=timezone.utc),
            },
            {
                "user_id": luis.id,
                "channel": NotificationChannel.email,
                "type": "enrollment_confirmation",
                "content": "You have been successfully enrolled in Portuguese B2 — Upper Intermediate Group.",
                "status": NotificationStatus.sent,
                "sent_at": datetime(2025, 8, 22, tzinfo=timezone.utc),
            },
            {
                "user_id": patrice.id,
                "channel": NotificationChannel.whatsapp,
                "type": "class_reminder",
                "content": "Reminder: your individual Portuguese class is tomorrow at 10:00.",
                "status": NotificationStatus.sent,
                "sent_at": datetime(2025, 8, 31, tzinfo=timezone.utc),
            },
            {
                "user_id": liam.id,
                "channel": NotificationChannel.email,
                "type": "waitlist_offer",
                "content": "A spot has opened in Portuguese A1 — Beginners Group. Log in to accept.",
                "status": NotificationStatus.pending,
                "sent_at": None,
            },
        ]
        for n in notification_data:
            existing = db.query(Notification).filter_by(
                user_id=n["user_id"], type=n["type"]
            ).first()
            if not existing:
                db.add(Notification(**n))
        db.commit()

        # ------------------------------------------------------------------ #
        # 16. COMMENTS
        # ------------------------------------------------------------------ #
        print("Seeding comments...")
        comment_data = [
            {
                "author": "Ana Costa",
                "rating": 5,
                "status": CommentStatus.published,
                "body": "Great teachers and practical classes.",
            },
            {
                "author": "Miguel Ferreira",
                "rating": 4,
                "status": CommentStatus.pending,
                "body": "Very good content and organization.",
            },
            {
                "author": "Sofia Mendes",
                "rating": 5,
                "status": CommentStatus.published,
                "body": "The lessons are clear, structured, and easy to follow.",
            },
        ]
        for c in comment_data:
            existing = db.query(Comment).filter_by(author=c["author"], body=c["body"]).first()
            if not existing:
                db.add(Comment(**c))
        db.commit()

        print("\n:) Seed complete.")
        print("─" * 40)
        print("Admin login:   admin@portugueseacademy.pt  /  Admin1234!")
        print("Student logins (all use password: Student1234!):")
        print("maria.silva@example.com")
        print("luis.costa@example.com")
        print("patrice.rousseau@example.com")
        print("liam.obrien@example.com")
        print("anabella.mendoza@example.com")
        print("─" * 40)

    except Exception as e:
        db.rollback()
        print(f"\n:( Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()