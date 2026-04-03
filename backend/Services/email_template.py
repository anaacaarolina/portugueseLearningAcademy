def registration_email_template(name: str):
    return f"""
    <h1>Welcome {name}!</h1>
    <p>Your account has been succesffuly made.</p>
    """
def payment_confirmation(name: str, amount: float):
    return f"""
        <h1>Payment Confirmed</h1>
        <p>Hello {name}, your payment of €{amount} was comfirmed.</p>
    """

def enrollment_confirmation(name: str, course: str):
    return f"""
        <h1>Enrollment Confirmed</h1>
        <p>You are enrolled in {course} was comfirmed.</p>
    """

def waitlist_confirmation(name: str):
    return f"""
        <h1>You're on the waitlist</h1>
        <p>We’ll notify you when a spot opens.</p>
    """

def email_verification(token: str):
    return f"""
        <h1>Verify your email</h1>
        <a href="http://localhost:5173/verify?token={token}">
            Click here to verify
        </a>
    """